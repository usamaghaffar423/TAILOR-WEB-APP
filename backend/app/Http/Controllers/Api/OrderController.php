<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Measurement;
use App\Models\MeasurementTemplate;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class OrderController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
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
            ];

            $orders = Cache::remember(CacheKeys::orders($filters), CacheKeys::ORDERS_TTL, function () use ($filters) {
                $query = DB::table('orders')
                    ->join('customers', 'customers.id', '=', 'orders.customer_id')
                    ->join('karigars', 'karigars.id', '=', 'orders.karigar_id')
                    // payments now hangs off sales, bridged via each order's
                    // mirrored sales row (sales.legacy_order_id) — see
                    // Order::payments() and store()/update()/destroy() below.
                    ->leftJoin('sales', 'sales.legacy_order_id', '=', 'orders.id')
                    ->leftJoin('payments', 'payments.sale_id', '=', 'sales.id');

                if ($filters['status']) {
                    $query->where('orders.status', $filters['status']);
                }

                if ($filters['karigar_id']) {
                    $query->where('orders.karigar_id', $filters['karigar_id']);
                }

                if ($filters['q']) {
                    $q = $filters['q'];
                    $query->where(function ($sub) use ($q) {
                        $sub->where('orders.order_no', 'like', "%{$q}%")
                            ->orWhere('customers.name', 'like', "%{$q}%");
                    });
                }

                if ($filters['from']) {
                    $query->whereDate('orders.deadline', '>=', $filters['from']);
                }

                if ($filters['to']) {
                    $query->whereDate('orders.deadline', '<=', $filters['to']);
                }

                return $query
                    ->groupBy(
                        'orders.id', 'orders.order_no', 'orders.status', 'orders.deadline',
                        'orders.assigned_date', 'orders.delivered_date', 'orders.total_amount',
                        'orders.created_at', 'customers.id', 'customers.name', 'customers.phone',
                        'karigars.id', 'karigars.name'
                    )
                    ->orderByDesc('orders.created_at')
                    ->get([
                        'orders.id',
                        'orders.order_no',
                        'orders.status',
                        'orders.deadline',
                        'orders.assigned_date',
                        'orders.delivered_date',
                        'orders.total_amount',
                        'customers.id as customer_id',
                        'customers.name as customer_name',
                        'customers.phone as customer_phone',
                        'karigars.id as karigar_id',
                        'karigars.name as karigar_name',
                        DB::raw('COALESCE(SUM(payments.amount), 0) as paid_amount'),
                    ]);
            });

            return response()->json(['data' => $orders]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $templateKey = $request->input('template_key');
            $measurement = Measurement::query()
                ->where('customer_id', $request->input('customer_id'))
                ->where('template_key', $templateKey)
                ->first();
            $template = MeasurementTemplate::query()->where('template_key', $templateKey)->first();

            $order = Order::query()->create([
                'order_no' => $this->nextOrderNo(),
                'customer_id' => $request->input('customer_id'),
                'style' => $request->input('style'),
                'items' => $request->input('items'),
                'measurement_snapshot' => [
                    'template_key' => $templateKey,
                    'template_label' => $template->label ?? $templateKey,
                    'fields' => $measurement?->fields ?? [],
                    'notes' => $measurement?->notes,
                ],
                'karigar_id' => $request->input('karigar_id'),
                'assigned_date' => Carbon::today()->toDateString(),
                'deadline' => $request->input('deadline'),
                'status' => $request->input('status', 'progress'),
                'total_amount' => $request->input('total_amount'),
            ]);

            // Mirror row so payments (which now hang off sales, not orders
            // directly — see Order::payments()) have somewhere to bridge
            // through for orders created via this still-live legacy flow.
            $sale = Sale::create([
                'legacy_order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'subtotal' => $order->total_amount,
                'total' => $order->total_amount,
                'status' => $this->mapOrderStatusToSaleStatus($order->status),
            ]);

            $advanceAmount = $request->input('advance_amount');
            if ($advanceAmount && (float) $advanceAmount > 0) {
                Payment::query()->create([
                    'sale_id' => $sale->id,
                    'amount' => $advanceAmount,
                    'method' => $request->input('advance_method'),
                    'date' => $request->input('advance_date', Carbon::today()->toDateString()),
                    'note' => $request->input('advance_note'),
                ]);
            }

            $order->load(['customer', 'karigar', 'photos', 'payments']);

            $this->cacheBuster->bustOrders();
            if ($advanceAmount && (float) $advanceAmount > 0) {
                $this->cacheBuster->bustPayments();
            }

            return response()->json(['data' => $order, 'message' => 'Created successfully.'], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $order = Cache::remember(CacheKeys::orderShow($id), CacheKeys::ORDERS_TTL, function () use ($id) {
                return Order::query()->with(['customer', 'karigar', 'photos', 'payments'])->find($id);
            });

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return response()->json(['data' => $order]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        try {
            $order = Order::query()->find($id);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $status = $request->input('status');

            $order->status = $status;
            $order->delivered_date = $status === 'delivered' ? Carbon::today()->toDateString() : null;
            $order->save();

            Sale::where('legacy_order_id', $order->id)->update(['status' => $this->mapOrderStatusToSaleStatus($status)]);

            $this->cacheBuster->bustOrders();

            return response()->json(['data' => $order, 'message' => 'Status updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function update(UpdateOrderRequest $request, int $id): JsonResponse
    {
        try {
            $order = Order::query()->find($id);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $status = $request->input('status');

            $order->karigar_id = $request->input('karigar_id');
            $order->deadline = $request->input('deadline');
            $order->status = $status;
            $order->total_amount = $request->input('total_amount');
            $order->delivered_date = $status === 'delivered'
                ? ($order->delivered_date ?? Carbon::today()->toDateString())
                : null;
            if ($request->has('style')) {
                $order->style = $request->input('style');
            }
            if ($request->has('items')) {
                $order->items = $request->input('items');
            }
            $order->save();

            Sale::where('legacy_order_id', $order->id)->update([
                'customer_id' => $order->customer_id,
                'subtotal' => $order->total_amount,
                'total' => $order->total_amount,
                'status' => $this->mapOrderStatusToSaleStatus($order->status),
            ]);

            $this->cacheBuster->bustOrders();

            return response()->json(['data' => $order, 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $order = Order::query()->find($id);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            // Cascades to the mirror sale's payments too (sales.legacy_order_id
            // -> sale_items/payments all cascadeOnDelete from sales.id),
            // matching the exact cascade the original payments.order_id FK
            // gave orders before the Sale/Bill unification migration.
            Sale::where('legacy_order_id', $order->id)->delete();
            $order->delete();

            $this->cacheBuster->bustOrders();

            return response()->json(['message' => 'Deleted successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    private function mapOrderStatusToSaleStatus(string $status): string
    {
        return match ($status) {
            'progress' => 'in_progress',
            'ready' => 'ready',
            'delivered' => 'completed',
            default => 'in_progress',
        };
    }

    private function nextOrderNo(): string
    {
        $max = DB::table('orders')
            ->selectRaw("MAX(CAST(SUBSTRING(order_no, 5) AS UNSIGNED)) as max_num")
            ->value('max_num');

        $next = ((int) $max) + 1;

        return 'ORD-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
