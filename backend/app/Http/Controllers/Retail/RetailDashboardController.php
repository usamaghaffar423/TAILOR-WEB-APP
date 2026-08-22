<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailProduct;
use App\Models\Retail\RetailSale;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Throwable;

class RetailDashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        try {
            $today = Carbon::today();

            $todaySales = RetailSale::query()->whereDate('sale_date', $today);

            $lowStockItems = RetailInventoryItem::query()
                ->with('variant.product')
                ->whereColumn('quantity_in_stock', '<=', 'low_stock_threshold')
                ->get()
                ->map(fn (RetailInventoryItem $item) => [
                    'variant_id' => $item->retail_product_variant_id,
                    'product_name' => $item->variant?->product?->name,
                    'size' => $item->variant?->size,
                    'color' => $item->variant?->color,
                    'quantity_in_stock' => $item->quantity_in_stock,
                    'threshold' => $item->low_stock_threshold,
                ]);

            $recentSales = RetailSale::query()
                ->with('items.variant.product')
                ->latest('sale_date')
                ->limit(5)
                ->get();

            return response()->json(['data' => [
                'today_sales_count' => (clone $todaySales)->count(),
                'today_revenue' => (clone $todaySales)->sum('total_amount'),
                'total_products' => RetailProduct::query()->active()->count(),
                'low_stock_count' => $lowStockItems->count(),
                'low_stock_items' => $lowStockItems->values(),
                'recent_sales' => $recentSales,
            ]]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
