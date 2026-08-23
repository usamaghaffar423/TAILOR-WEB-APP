<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailProduct;
use App\Models\Retail\RetailProductVariant;
use App\Models\Retail\RetailSaleItem;
use App\Services\Cache\CacheBuster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Throwable;

class RetailVariantController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
    {
    }

    public function store(Request $request, int $productId): JsonResponse
    {
        try {
            $product = RetailProduct::query()->find($productId);

            if (! $product) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $data = $request->validate([
                'size' => 'nullable|string|max:20',
                'color' => 'nullable|string|max:50',
            ]);

            $sku = strtoupper(substr($product->name, 0, 3))
                .'-'.strtoupper($data['size'] ?? '')
                .'-'.strtoupper($data['color'] ?? '')
                .'-'.uniqid();

            $variant = RetailProductVariant::query()->create([
                'retail_product_id' => $product->id,
                'size' => $data['size'] ?? null,
                'color' => $data['color'] ?? null,
                'sku' => $sku,
            ]);

            RetailInventoryItem::query()->create([
                'retail_product_variant_id' => $variant->id,
                'quantity_in_stock' => 0,
                'low_stock_threshold' => 5,
            ]);

            // New variant + its inventory row.
            $this->cacheBuster->bustRetailInventory();

            return response()->json(['data' => $variant->load('inventory'), 'message' => 'Variant added.'], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function uploadImage(Request $request, int $variantId): JsonResponse
    {
        try {
            $variant = RetailProductVariant::query()->find($variantId);

            if (! $variant) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,webp|max:2048',
            ]);

            $file = $request->file('image');
            $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
            $file->storeAs("uploads/retail/variants/{$variantId}", $filename, 'local');

            $relativePath = "retail/variants/{$variantId}/{$filename}";
            $variant->update(['image_path' => $relativePath]);

            $this->cacheBuster->bustRetailProducts();

            return response()->json(['data' => $variant, 'message' => 'Image uploaded successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(int $variantId): JsonResponse
    {
        try {
            $variant = RetailProductVariant::query()->find($variantId);

            if (! $variant) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            if (RetailSaleItem::where('retail_product_variant_id', $variantId)->exists()) {
                return response()->json(['message' => 'Cannot delete a variant that has sale history.'], 409);
            }

            $variant->delete();

            $this->cacheBuster->bustRetailInventory();

            return response()->json(['message' => 'Deleted successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
