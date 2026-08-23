<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailSale;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use App\Services\Retail\RetailSaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Throwable;

class RetailSaleController extends Controller
{
    public function __construct(
        private RetailSaleService $sales,
        private CacheBuster $cacheBuster
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
                'payment_method' => $request->query('payment_method'),
                'product_id' => $request->query('product_id'),
                'page' => max(1, (int) $request->query('page', 1)),
            ];

            $sales = Cache::remember(CacheKeys::retailSales($filters), CacheKeys::RETAIL_SALES_TTL, function () use ($filters) {
                $query = RetailSale::query()->withCount('items')->latest('sale_date');

                if ($filters['date_from']) {
                    $query->whereDate('sale_date', '>=', $filters['date_from']);
                }

                if ($filters['date_to']) {
                    $query->whereDate('sale_date', '<=', $filters['date_to']);
                }

                if ($filters['payment_method']) {
                    $query->where('payment_method', $filters['payment_method']);
                }

                if ($filters['product_id']) {
                    $productId = $filters['product_id'];
                    $query->whereHas('items.variant', function ($q) use ($productId) {
                        $q->where('retail_product_id', $productId);
                    });
                }

                return $query->paginate(20, ['*'], 'page', $filters['page']);
            });

            return response()->json($sales);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'payment_method' => 'nullable|in:cash,card,easypaisa,jazzcash',
                'customer_name' => 'nullable|string|max:255',
                'customer_phone' => 'nullable|string|max:20',
                'items' => 'required|array|min:1',
                'items.*.variant_id' => 'required|integer|exists:retail_product_variants,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
            ]);

            $adminId = $request->attributes->get('admin')?->id;

            $sale = $this->sales->createSale(
                $data,
                $data['items'],
                $adminId
            );

            // A confirmed sale both records a sale and deducts stock.
            $this->cacheBuster->bustRetailSales();
            $this->cacheBuster->bustRetailInventory();

            return response()->json(['data' => $sale, 'message' => 'Sale recorded.'], 201);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $sale = Cache::remember(
                CacheKeys::retailSaleShow($id),
                CacheKeys::RETAIL_SALES_TTL,
                fn () => RetailSale::query()->with('items.variant.product')->find($id)
            );

            if (! $sale) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return response()->json(['data' => $sale]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
