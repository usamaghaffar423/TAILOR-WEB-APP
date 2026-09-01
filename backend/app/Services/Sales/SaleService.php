<?php

namespace App\Services\Sales;

use App\Models\Measurement;
use App\Models\MeasurementTemplate;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\Retail\RetailInventoryService;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(private RetailInventoryService $inventory)
    {
    }

    /**
     * Create a sale with all items atomically — one sale, any number of
     * lines, each optionally a stock-backed retail item and/or a stitched
     * garment. $items shape matches StoreSaleRequest's validated array.
     *
     * $data['customer_id'] presence/absence is already enforced by the
     * caller (SaleController) before this runs — "required if any item
     * needs stitching" is a business rule checked there, not here.
     */
    public function createSale(array $data, array $items, ?int $adminId): Sale
    {
        return DB::transaction(function () use ($data, $items, $adminId) {
            $lineTotals = collect($items)->map(fn ($i) => $i['qty'] * $i['unit_price']);
            $subtotal = $lineTotals->sum();
            $discount = $data['discount'] ?? 0;
            $total = $subtotal - $discount;

            $sale = Sale::create([
                'sale_no' => $this->nextSaleNo(),
                'customer_id' => $data['customer_id'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'status' => $data['status'] ?? $this->deriveStatus($items),
            ]);

            foreach ($items as $item) {
                $needsStitching = ! empty($item['needs_stitching']);
                $measurementSnapshot = null;

                // Measurements live on the customer, not the sale — same as
                // the legacy Order Studio flow, a stitched line just
                // snapshots whatever is currently saved for that customer +
                // template (already saved via customersApi.upsertMeasurement
                // before this request, from the frontend's measurement form).
                if ($needsStitching && ! empty($item['template_key'])) {
                    $templateKey = $item['template_key'];
                    $measurement = Measurement::query()
                        ->where('customer_id', $data['customer_id'])
                        ->where('template_key', $templateKey)
                        ->first();
                    $template = MeasurementTemplate::query()->where('template_key', $templateKey)->first();

                    $measurementSnapshot = [
                        'template_key' => $templateKey,
                        'template_label' => $template->label ?? $templateKey,
                        'fields' => $measurement?->fields ?? [],
                        'notes' => $measurement?->notes,
                    ];
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'retail_product_variant_id' => $item['retail_product_variant_id'] ?? null,
                    'label' => $item['label'],
                    'recipient_name' => $item['recipient_name'] ?? null,
                    'qty' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'line_total' => $item['qty'] * $item['unit_price'],
                    'needs_stitching' => $needsStitching,
                    'measurement_template_key' => $needsStitching ? ($item['template_key'] ?? null) : null,
                    'measurement_snapshot' => $measurementSnapshot,
                    'style' => $needsStitching ? ($item['style'] ?? null) : null,
                    'karigar_id' => $needsStitching ? ($item['karigar_id'] ?? null) : null,
                    'deadline' => $needsStitching ? ($item['deadline'] ?? null) : null,
                    'item_status' => $needsStitching ? 'progress' : 'n_a',
                ]);

                if (! empty($item['retail_product_variant_id'])) {
                    // Reused unchanged — deductForSale takes a generic
                    // reference id with no FK constraint, so it repoints
                    // cleanly to the new sales.id instead of a
                    // retail_sales.id. Throws (rolling back the whole
                    // transaction) if stock is insufficient.
                    $this->inventory->deductForSale($item['retail_product_variant_id'], $item['qty'], $sale->id, $adminId);
                }
            }

            $advanceAmount = $data['advance_amount'] ?? null;
            if ($advanceAmount && (float) $advanceAmount > 0) {
                Payment::query()->create([
                    'sale_id' => $sale->id,
                    'amount' => $advanceAmount,
                    'method' => $data['advance_method'],
                    'date' => $data['advance_date'] ?? now()->toDateString(),
                    'note' => $data['advance_note'] ?? null,
                ]);
            }

            return $sale->load(['customer', 'items.variant.product', 'items.karigar', 'payments']);
        });
    }

    private function deriveStatus(array $items): string
    {
        $hasStitched = collect($items)->contains(fn ($i) => ! empty($i['needs_stitching']));

        return $hasStitched ? 'in_progress' : 'completed';
    }

    /**
     * Same unlocked max+1 pattern as the legacy OrderController::nextOrderNo()
     * / CustomerController::nextCustomerId() — kept consistent with existing
     * code rather than introducing new locking; this doesn't change that
     * pre-existing, already-accepted race-condition profile. Only counts
     * rows with a non-null sale_no, since backfilled legacy rows have none.
     */
    private function nextSaleNo(): string
    {
        $max = DB::table('sales')
            ->whereNotNull('sale_no')
            ->selectRaw('MAX(CAST(SUBSTRING(sale_no, 5) AS UNSIGNED)) as max_num')
            ->value('max_num');

        $next = ((int) $max) + 1;

        return 'INV-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
