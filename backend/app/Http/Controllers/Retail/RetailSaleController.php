<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailSale;
use App\Services\Retail\RetailSaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

class RetailSaleController extends Controller
{
    public function __construct(private RetailSaleService $sales)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = RetailSale::query()->withCount('items')->latest('sale_date');

            if ($from = $request->query('date_from')) {
                $query->whereDate('sale_date', '>=', $from);
            }

            if ($to = $request->query('date_to')) {
                $query->whereDate('sale_date', '<=', $to);
            }

            if ($method = $request->query('payment_method')) {
                $query->where('payment_method', $method);
            }

            if ($productId = $request->query('product_id')) {
                $query->whereHas('items.variant', function ($q) use ($productId) {
                    $q->where('retail_product_id', $productId);
                });
            }

            $sales = $query->paginate(20);

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
            $sale = RetailSale::query()->with('items.variant.product')->find($id);

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
