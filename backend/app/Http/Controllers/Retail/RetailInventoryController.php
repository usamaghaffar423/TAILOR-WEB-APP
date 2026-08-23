<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailStockMovement;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use App\Services\Retail\RetailInventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Throwable;

class RetailInventoryController extends Controller
{
    public function __construct(
        private RetailInventoryService $inventory,
        private CacheBuster $cacheBuster
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $lowStockOnly = $request->boolean('low_stock');

            $items = Cache::remember(CacheKeys::retailInventory($lowStockOnly), CacheKeys::RETAIL_INVENTORY_TTL, function () use ($lowStockOnly) {
                $query = RetailInventoryItem::query()->with('variant.product');

                if ($lowStockOnly) {
                    $query->whereColumn('quantity_in_stock', '<=', 'low_stock_threshold');
                }

                return $query->get();
            });

            return response()->json(['data' => $items]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function restock(Request $request, int $variantId): JsonResponse
    {
        try {
            $data = $request->validate([
                'qty' => 'required|integer|min:1',
                'note' => 'nullable|string|max:255',
            ]);

            $adminId = $request->attributes->get('admin')?->id;
            $this->inventory->addStock($variantId, $data['qty'], 'PURCHASE_IN', $data['note'] ?? null, $adminId);

            $item = RetailInventoryItem::where('retail_product_variant_id', $variantId)->firstOrFail();

            $this->cacheBuster->bustRetailInventory();

            return response()->json(['data' => $item, 'message' => 'Stock updated.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function adjust(Request $request, int $variantId): JsonResponse
    {
        try {
            $data = $request->validate([
                'new_qty' => 'required|integer|min:0',
                'note' => 'required|string|max:255',
            ]);

            $adminId = $request->attributes->get('admin')?->id;
            $this->inventory->adjustStock($variantId, $data['new_qty'], $data['note'], $adminId);

            $item = RetailInventoryItem::where('retail_product_variant_id', $variantId)->firstOrFail();

            $this->cacheBuster->bustRetailInventory();

            return response()->json(['data' => $item, 'message' => 'Stock adjusted.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function movements(int $variantId): JsonResponse
    {
        try {
            $page = max(1, (int) request()->query('page', 1));

            $movements = Cache::remember(
                CacheKeys::retailMovements($variantId, $page),
                CacheKeys::RETAIL_INVENTORY_TTL,
                fn () => RetailStockMovement::where('retail_product_variant_id', $variantId)
                    ->latest()
                    ->paginate(15, ['*'], 'page', $page)
            );

            return response()->json($movements);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
