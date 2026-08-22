<?php

namespace App\Services\Retail;

use App\Models\Retail\RetailInventoryItem;
use App\Models\Retail\RetailStockMovement;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RetailInventoryService
{
    /**
     * Atomically decrement stock and log the movement.
     * Throws RuntimeException if insufficient stock.
     */
    public function deductForSale(int $variantId, int $qty, int $saleId, ?int $adminId): void
    {
        DB::transaction(function () use ($variantId, $qty, $saleId, $adminId) {
            $item = RetailInventoryItem::where('retail_product_variant_id', $variantId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($item->quantity_in_stock < $qty) {
                throw new RuntimeException(
                    "Insufficient stock for variant #{$variantId}. Available: {$item->quantity_in_stock}, requested: {$qty}."
                );
            }

            $item->decrement('quantity_in_stock', $qty);

            RetailStockMovement::create([
                'retail_product_variant_id' => $variantId,
                'type' => 'SALE_OUT',
                'quantity' => -$qty,
                'reference_id' => $saleId,
                'created_by' => $adminId,
            ]);
        });
    }

    /**
     * Add stock (purchase/restock) and log movement.
     */
    public function addStock(int $variantId, int $qty, string $type, ?string $note, ?int $adminId): void
    {
        DB::transaction(function () use ($variantId, $qty, $type, $note, $adminId) {
            $item = RetailInventoryItem::firstOrCreate(
                ['retail_product_variant_id' => $variantId],
                ['quantity_in_stock' => 0, 'low_stock_threshold' => 5]
            );

            $item->increment('quantity_in_stock', $qty);
            $item->update(['last_restocked_at' => now()]);

            RetailStockMovement::create([
                'retail_product_variant_id' => $variantId,
                'type' => $type,
                'quantity' => $qty,
                'note' => $note,
                'created_by' => $adminId,
            ]);
        });
    }

    /**
     * Manual adjustment — absolute count reconciliation.
     */
    public function adjustStock(int $variantId, int $newQty, string $note, ?int $adminId): void
    {
        DB::transaction(function () use ($variantId, $newQty, $note, $adminId) {
            $item = RetailInventoryItem::where('retail_product_variant_id', $variantId)
                ->lockForUpdate()
                ->firstOrFail();

            $diff = $newQty - $item->quantity_in_stock;
            $item->update(['quantity_in_stock' => $newQty]);

            RetailStockMovement::create([
                'retail_product_variant_id' => $variantId,
                'type' => 'ADJUSTMENT',
                'quantity' => $diff,
                'note' => $note,
                'created_by' => $adminId,
            ]);
        });
    }
}
