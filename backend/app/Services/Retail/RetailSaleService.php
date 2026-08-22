<?php

namespace App\Services\Retail;

use App\Models\Retail\RetailSale;
use App\Models\Retail\RetailSaleItem;
use Illuminate\Support\Facades\DB;

class RetailSaleService
{
    public function __construct(private RetailInventoryService $inventory)
    {
    }

    /**
     * Create a sale with all items atomically.
     * $items = [['variant_id' => int, 'quantity' => int, 'unit_price' => float], ...]
     */
    public function createSale(array $data, array $items, ?int $adminId): RetailSale
    {
        return DB::transaction(function () use ($data, $items, $adminId) {
            $total = collect($items)->sum(fn ($i) => $i['quantity'] * $i['unit_price']);

            $sale = RetailSale::create([
                'sale_date' => now(),
                'total_amount' => $total,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'customer_name' => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'created_by' => $adminId,
            ]);

            foreach ($items as $item) {
                RetailSaleItem::create([
                    'retail_sale_id' => $sale->id,
                    'retail_product_variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                ]);

                // Deduct stock — throws if insufficient, rolls back entire transaction
                $this->inventory->deductForSale($item['variant_id'], $item['quantity'], $sale->id, $adminId);
            }

            return $sale->load('items.variant.product');
        });
    }
}
