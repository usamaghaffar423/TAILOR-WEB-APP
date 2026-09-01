<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use App\Services\Sales\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class SaleController extends Controller
{
    public function __construct(private SaleService $saleService, private CacheBuster $cacheBuster)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'status' => $request->query('status'),
                'karigar_id' => $request->query('karigar_id'),
                'q' => $request->query('q'),
                'from' => $request->query('from'),
                'to' => $request->query('to'),
                // '1' = only sales with a stitched line, '0' = only pure
                // retail sales, omitted = everything. Orders.tsx and
                // retail's Sales History both hit this same endpoint,
                // differing only in this default.
                'stitched' => $request->query('stitched'),
            ];

            $sales = Cache::remember(CacheKeys::sales($filters), CacheKeys::SALES_TTL, function () use ($filters) {
                $query = DB::table('sales')
                    ->leftJoin('customers', 'customers.id', '=', 'sales.customer_id')
                    ->leftJoin('orders as legacy_orders', 'legacy_orders.id', '=', 'sales.legacy_order_id')
                    ->leftJoin('payments', 'payments.sale_id', '=', 'sales.id');

                if ($filters['status']) {
                    $query->where('sales.status', $filters['status']);
                }
                if ($filters['karigar_id']) {
                    $karigarId = $filters['karigar_id'];
                    $query->whereExists(function ($sub) use ($karigarId) {
                        $sub->selectRaw(1)->from('sale_items')
                            ->whereColumn('sale_items.sale_id', 'sales.id')
                            ->where('sale_items.karigar_id', $karigarId);
                    });
                }
                if ($filters['q']) {
                    $q = $filters['q'];
                    $query->where(function ($sub) use ($q) {
                        $sub->where('sales.sale_no', 'like', "%{$q}%")
                            ->orWhere('legacy_orders.order_no', 'like', "%{$q}%")
                            ->orWhere('customers.name', 'like', "%{$q}%");
                    });
                }
                if ($filters['from']) {
                    $query->whereDate('sales.created_at', '>=', $filters['from']);
                }
                if ($filters['to']) {
                    $query->whereDate('sales.created_at', '<=', $filters['to']);
                }
                if ($filters['stitched'] !== null) {
                    $existsStitched = function ($sub) {
                        $sub->selectRaw(1)->from('sale_items')
                            ->whereColumn('sale_items.sale_id', 'sales.id')
                            ->where('sale_items.needs_stitching', true);
                    };
                    $filters['stitched'] === '1' ? $query->whereExists($existsStitched) : $query->whereNotExists($existsStitched);
                }

                return $query
                    ->groupBy(
                        'sales.id', 'sales.sale_no', 'sales.legacy_order_id', 'sales.legacy_retail_sale_id',
                        'sales.status', 'sales.total', 'sales.created_at',
                        'customers.id', 'customers.name', 'customers.phone', 'legacy_orders.order_no'
                    )
                    ->orderByDesc('sales.created_at')
                    ->get([
                        'sales.id',
                        'sales.sale_no',
                        'sales.legacy_order_id',
                        'sales.legacy_retail_sale_id',
                        'sales.status',
                        'sales.total',
                        'sales.created_at',
                        'customers.id as customer_id',
                        'customers.name as customer_name',
                        'customers.phone as customer_phone',
                        'legacy_orders.order_no as legacy_order_no',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                    ]);
            });

            // Enriched in PHP with one extra indexed query rather than
            // joining sale_items into the grouped query above, which would
            // multiply rows per line item and break the payments SUM.
            $saleIds = $sales->pluck('id');
            $itemRows = DB::table('sale_items')
                ->whereIn('sale_id', $saleIds)
                ->leftJoin('karigars', 'karigars.id', '=', 'sale_items.karigar_id')
                ->get(['sale_items.sale_id', 'sale_items.needs_stitching', 'sale_items.deadline', 'karigars.name as karigar_name']);
            $itemsBySale = $itemRows->groupBy('sale_id');

            $sales = $sales->map(function ($sale) use ($itemsBySale) {
                $items = $itemsBySale->get($sale->id, collect());
                $stitched = $items->firstWhere('needs_stitching', 1);
                $sale->item_count = $items->count();
                $sale->has_stitching = (bool) $stitched;
                $sale->karigar_name = $stitched->karigar_name ?? null;
                $sale->deadline = $stitched->deadline ?? null;
                // Never invent a number — legacy rows show exactly what was
                // already printed/sent (ORD-0007, or the bare retail id),
                // only sales created after this migration get sale_no.
                $sale->display_no = $sale->sale_no
                    ?? $sale->legacy_order_no
                    ?? ($sale->legacy_retail_sale_id ? '#'.$sale->legacy_retail_sale_id : '#'.$sale->id);
                unset($sale->legacy_order_no);

                return $sale;
            });

            return response()->json(['data' => $sales]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        try {
            $items = $request->input('items');
            $customerId = $request->input('customer_id');

            $hasStitchedItem = collect($items)->contains(fn ($i) => ! empty($i['needs_stitching']));
            if ($hasStitchedItem && ! $customerId) {
                return response()->json([
                    'message' => 'A customer is required for any item that needs stitching.',
                    'errors' => ['customer_id' => ['A customer is required for any item that needs stitching.']],
                ], 422);
            }

            foreach ($items as $item) {
                if (! empty($item['needs_stitching']) && (empty($item['karigar_id']) || empty($item['deadline']) || empty($item['template_key']))) {
                    return response()->json([
                        'message' => 'Every stitched item needs a garment template, karigar, and deadline.',
                    ], 422);
                }
            }

            $admin = $request->attributes->get('admin');
            $sale = $this->saleService->createSale($request->all(), $items, $admin?->id);

            $this->cacheBuster->bustSales();
            if (collect($items)->contains(fn ($i) => ! empty($i['retail_product_variant_id']))) {
                $this->cacheBuster->bustRetailInventory();
            }
            if ($request->input('advance_amount') > 0) {
                $this->cacheBuster->bustPayments();
            }

            return response()->json(['data' => $sale, 'message' => 'Sale created successfully.'], 201);
        } catch (RuntimeException $e) {
            // Insufficient stock, thrown by RetailInventoryService — the
            // whole transaction already rolled back.
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $sale = Cache::remember(CacheKeys::saleShow($id), CacheKeys::SALES_TTL, function () use ($id) {
                return Sale::query()->with(['customer', 'items.variant.product', 'items.karigar', 'items.photos', 'payments'])->find($id);
            });

            if (! $sale) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return response()->json(['data' => $sale]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function update(UpdateSaleRequest $request, int $id): JsonResponse
    {
        try {
            $sale = Sale::query()->find($id);

            if (! $sale) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            if ($request->has('status')) {
                $sale->status = $request->input('status');
                $sale->save();
            }

            foreach ($request->input('items', []) as $itemInput) {
                $item = SaleItem::query()->where('id', $itemInput['id'])->where('sale_id', $sale->id)->first();
                if (! $item) {
                    continue;
                }
                if (array_key_exists('karigar_id', $itemInput)) {
                    $item->karigar_id = $itemInput['karigar_id'];
                }
                if (array_key_exists('deadline', $itemInput)) {
                    $item->deadline = $itemInput['deadline'];
                }
                if (array_key_exists('item_status', $itemInput) && $itemInput['item_status']) {
                    $item->item_status = $itemInput['item_status'];
                    $item->delivered_date = $itemInput['item_status'] === 'delivered'
                        ? ($item->delivered_date ?? now()->toDateString())
                        : null;
                }
                if (array_key_exists('style', $itemInput)) {
                    $item->style = $itemInput['style'];
                }
                $item->save();
            }

            $this->cacheBuster->bustSales();

            return response()->json(['data' => $sale->load(['customer', 'items.variant.product', 'items.karigar', 'payments']), 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    /**
     * Per-item status change — the equivalent of the legacy
     * PATCH /orders/{id}/status, now scoped to one line since a sale can
     * hold multiple independently-tracked stitched items.
     */
    public function updateItemStatus(Request $request, int $itemId): JsonResponse
    {
        try {
            $request->validate([
                'item_status' => ['required', 'in:n_a,progress,ready,delivered'],
            ]);

            $item = SaleItem::query()->find($itemId);
            if (! $item) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $status = $request->input('item_status');
            $item->item_status = $status;
            $item->delivered_date = $status === 'delivered' ? ($item->delivered_date ?? now()->toDateString()) : null;
            $item->save();

            $this->cacheBuster->bustSales();

            return response()->json(['data' => $item, 'message' => 'Status updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $sale = Sale::query()->find($id);

            if (! $sale) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $sale->delete();

            $this->cacheBuster->bustSales();

            return response()->json(['message' => 'Deleted successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
