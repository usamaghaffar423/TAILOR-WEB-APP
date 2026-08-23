<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailProduct;
use App\Models\Retail\RetailProductVariant;
use App\Models\Retail\RetailSaleItem;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Throwable;

class RetailProductController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
    {
    }

    public function index(): JsonResponse
    {
        try {
            $products = Cache::remember(CacheKeys::retailProducts(), CacheKeys::RETAIL_PRODUCTS_TTL, function () {
                return RetailProduct::query()
                    ->with('variants.inventory')
                    ->orderBy('name')
                    ->get();
            });

            return response()->json(['data' => $products]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'category' => 'nullable|string|max:100',
                'description' => 'nullable|string',
                'sale_price' => 'required|numeric|min:0',
                'variants' => 'nullable|array',
                'variants.*.size' => 'nullable|string|max:20',
                'variants.*.color' => 'nullable|string|max:50',
            ]);

            $product = RetailProduct::query()->create([
                'name' => $data['name'],
                'category' => $data['category'] ?? null,
                'description' => $data['description'] ?? null,
                'sale_price' => $data['sale_price'],
            ]);

            foreach ($data['variants'] ?? [] as $variantData) {
                $this->createVariant($product, $variantData['size'] ?? null, $variantData['color'] ?? null);
            }

            $this->cacheBuster->bustRetailProducts();
            if (! empty($data['variants'])) {
                $this->cacheBuster->bustRetailInventory();
            }

            return response()->json([
                'data' => $product->load('variants.inventory'),
                'message' => 'Created successfully.',
            ], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $data = Cache::remember(CacheKeys::retailProductShow($id), CacheKeys::RETAIL_PRODUCTS_TTL, function () use ($id) {
                $product = RetailProduct::query()->with(['variants.inventory'])->find($id);

                if (! $product) {
                    return null;
                }

                $movements = collect();
                foreach ($product->variants as $variant) {
                    $movements = $movements->merge(
                        $variant->stockMovements()->latest()->limit(20)->get()
                    );
                }

                $data = $product->toArray();
                $data['recent_movements'] = $movements->sortByDesc('created_at')->take(20)->values();

                return $data;
            });

            if (! $data) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return response()->json(['data' => $data]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $product = RetailProduct::query()->find($id);

            if (! $product) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $data = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'category' => 'nullable|string|max:100',
                'description' => 'nullable|string',
                'sale_price' => 'sometimes|required|numeric|min:0',
                'is_active' => 'sometimes|boolean',
            ]);

            $product->update($data);

            $this->cacheBuster->bustRetailProducts();
            if (array_key_exists('sale_price', $data) || array_key_exists('is_active', $data)) {
                // Embedded in cached inventory rows and dashboard totals.
                $this->cacheBuster->bustRetailInventory();
            }

            return response()->json(['data' => $product->load('variants.inventory'), 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $product = RetailProduct::query()->find($id);

            if (! $product) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $variantIds = $product->variants()->pluck('id');
            $hasSales = RetailSaleItem::whereIn('retail_product_variant_id', $variantIds)->exists();

            // Soft-deactivate always — never hard-delete, sales or not.
            $product->update(['is_active' => false]);

            $this->cacheBuster->bustRetailProducts();
            $this->cacheBuster->bustRetailInventory();

            return response()->json([
                'message' => $hasSales
                    ? 'Product deactivated (sale history preserved).'
                    : 'Product deactivated.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    private function createVariant(RetailProduct $product, ?string $size, ?string $color): RetailProductVariant
    {
        $sku = strtoupper(substr($product->name, 0, 3))
            .'-'.strtoupper($size ?? '')
            .'-'.strtoupper($color ?? '')
            .'-'.uniqid();

        $variant = RetailProductVariant::query()->create([
            'retail_product_id' => $product->id,
            'size' => $size,
            'color' => $color,
            'sku' => $sku,
        ]);

        RetailInventoryItem::query()->create([
            'retail_product_variant_id' => $variant->id,
            'quantity_in_stock' => 0,
            'low_stock_threshold' => 5,
        ]);

        return $variant;
    }
}
