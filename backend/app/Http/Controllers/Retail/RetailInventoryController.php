<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailStockMovement;
use App\Services\Retail\RetailInventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class RetailInventoryController extends Controller
{
    public function __construct(private RetailInventoryService $inventory)
    {
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = RetailInventoryItem::query()->with('variant.product');

            if ($request->boolean('low_stock')) {
                $query->whereColumn('quantity_in_stock', '<=', 'low_stock_threshold');
            }

            $items = $query->get();

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

            return response()->json(['data' => $item, 'message' => 'Stock adjusted.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function movements(int $variantId): JsonResponse
    {
        try {
            $movements = RetailStockMovement::where('retail_product_variant_id', $variantId)
                ->latest()
                ->paginate(15);

            return response()->json($movements);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
