<?php

namespace App\Http\Controllers\Retail;

use App\Http\Controllers\Controller;
use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailProduct;
use App\Models\Retail\RetailProductVariant;
use App\Models\Retail\RetailSale;
use App\Models\Retail\RetailSaleItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

class RetailDashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        try {
            $today = Carbon::today();
            $startOfWeek = $today->copy()->startOfWeek();
            $startOfMonth = $today->copy()->startOfMonth();

            $revenue = [
                'today' => $this->revenueSince($today),
                'this_week' => $this->revenueSince($startOfWeek),
                'this_month' => $this->revenueSince($startOfMonth),
                'all_time' => $this->revenueSince(null),
            ];

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

            $inventoryValue = RetailInventoryItem::query()
                ->join('retail_product_variants', 'retail_product_variants.id', '=', 'retail_inventory_items.retail_product_variant_id')
                ->join('retail_products', 'retail_products.id', '=', 'retail_product_variants.retail_product_id')
                ->sum(DB::raw('retail_inventory_items.quantity_in_stock * retail_products.sale_price'));

            $paymentBreakdown = RetailSale::query()
                ->where('sale_date', '>=', $startOfMonth)
                ->groupBy('payment_method')
                ->select('payment_method', DB::raw('SUM(total_amount) as total'), DB::raw('COUNT(*) as count'))
                ->get();

            $topProducts = RetailSaleItem::query()
                ->join('retail_sales', 'retail_sales.id', '=', 'retail_sale_items.retail_sale_id')
                ->join('retail_product_variants', 'retail_product_variants.id', '=', 'retail_sale_items.retail_product_variant_id')
                ->join('retail_products', 'retail_products.id', '=', 'retail_product_variants.retail_product_id')
                ->where('retail_sales.sale_date', '>=', $startOfMonth)
                ->groupBy('retail_products.id', 'retail_products.name')
                ->select(
                    'retail_products.name as product_name',
                    DB::raw('SUM(retail_sale_items.quantity) as qty_sold'),
                    DB::raw('SUM(retail_sale_items.subtotal) as revenue')
                )
                ->orderByDesc('revenue')
                ->limit(5)
                ->get();

            $recentSales = RetailSale::query()
                ->with('items.variant.product')
                ->latest('sale_date')
                ->limit(8)
                ->get();

            return response()->json(['data' => [
                'revenue' => $revenue,
                'total_products' => RetailProduct::query()->active()->count(),
                'total_variants' => RetailProductVariant::query()->count(),
                'inventory_value' => round($inventoryValue, 2),
                'low_stock_count' => $lowStockItems->count(),
                'low_stock_items' => $lowStockItems->values(),
                'payment_breakdown' => $paymentBreakdown,
                'top_products' => $topProducts,
                'recent_sales' => $recentSales,
                // Kept for backward compatibility with any older client build.
                'today_sales_count' => $revenue['today']['count'],
                'today_revenue' => $revenue['today']['total'],
            ]]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    private function revenueSince(?Carbon $since): array
    {
        $query = RetailSale::query();
        if ($since) {
            $query->where('sale_date', '>=', $since);
        }

        return [
            'total' => round((clone $query)->sum('total_amount'), 2),
            'count' => (clone $query)->count(),
        ];
    }
}
