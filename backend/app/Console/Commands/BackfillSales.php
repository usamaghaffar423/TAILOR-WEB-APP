<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillSales extends Command
{
    protected $signature = 'app:backfill-sales {--dry-run : Report counts/samples only, write nothing}';

    protected $description = 'Backfill legacy orders and retail_sales into the unified sales/sale_items tables';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $this->info($dryRun ? 'DRY RUN — no writes will be made.' : 'LIVE RUN — writing to the database.');

        $alreadyFromOrders = DB::table('sales')->whereNotNull('legacy_order_id')->pluck('legacy_order_id')->all();
        $alreadyFromRetail = DB::table('sales')->whereNotNull('legacy_retail_sale_id')->pluck('legacy_retail_sale_id')->all();

        $orders = DB::table('orders')->whereNotIn('id', $alreadyFromOrders ?: [0])->orderBy('id')->get();
        $retailSales = DB::table('retail_sales')->whereNotIn('id', $alreadyFromRetail ?: [0])->orderBy('id')->get();

        $plannedItems = 0;
        foreach ($orders as $order) {
            $items = json_decode($order->items ?? '', true);
            $plannedItems += (is_array($items) && count($items) > 0) ? count($items) : 1;
        }
        $retailItemCounts = DB::table('retail_sale_items')
            ->whereIn('retail_sale_id', $retailSales->pluck('id'))
            ->count();
        $plannedItems += $retailItemCounts;

        $this->line('orders to backfill:       '.$orders->count().' (already done: '.count($alreadyFromOrders).')');
        $this->line('retail_sales to backfill: '.$retailSales->count().' (already done: '.count($alreadyFromRetail).')');
        $this->line('planned sale_items rows:  '.$plannedItems);
        $this->line('payments to remap (orders): '.DB::table('payments')->whereIn('sale_id', $orders->pluck('id'))->count());
        $this->line('payments to create (retail sales, one per sale): '.$retailSales->count());

        if ($orders->isNotEmpty()) {
            $sample = $orders->first();
            $this->line("Sample order #{$sample->id} ({$sample->order_no}): customer_id={$sample->customer_id}, total={$sample->total_amount}, status={$sample->status}");
        }
        if ($retailSales->isNotEmpty()) {
            $sample = $retailSales->first();
            $this->line("Sample retail_sale #{$sample->id}: total={$sample->total_amount}, method={$sample->payment_method}, customer_name=".($sample->customer_name ?? 'null'));
        }

        if ($dryRun) {
            $this->info('Dry run complete — no changes made.');

            return self::SUCCESS;
        }

        if ($orders->isEmpty() && $retailSales->isEmpty()) {
            $this->info('Nothing to backfill.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($orders, $retailSales) {
            foreach ($orders as $order) {
                $this->backfillOrder($order);
            }

            // Remap every order-derived payment to its real new sale.id
            // BEFORE inserting a single retail sale. This must run before
            // any retail sale exists: a retail sale's own new sales.id is
            // just as capable of numerically colliding with some other
            // order's legacy_order_id as two orders' ids are with each
            // other — this reordering removes that class of collision
            // entirely, rather than just narrowing the odds of it, by
            // guaranteeing no retail-derived payments.sale_id values exist
            // yet for this JOIN to ever accidentally match against.
            DB::statement('
                UPDATE payments p
                JOIN sales s ON s.legacy_order_id = p.sale_id
                SET p.sale_id = s.id
            ');

            foreach ($retailSales as $retailSale) {
                $this->backfillRetailSale($retailSale);
            }
        });

        $this->info('Backfill complete.');

        return self::SUCCESS;
    }

    private function backfillOrder(object $order): void
    {
        $statusMap = ['progress' => 'in_progress', 'ready' => 'ready', 'delivered' => 'completed'];

        $saleId = DB::table('sales')->insertGetId([
            'legacy_order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'subtotal' => $order->total_amount,
            'discount' => 0,
            'total' => $order->total_amount,
            'status' => $statusMap[$order->status] ?? 'in_progress',
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ]);

        $items = json_decode($order->items ?? '', true);
        if (! is_array($items) || count($items) === 0) {
            $items = [['label' => 'Stitching Charges', 'amount' => (float) $order->total_amount]];
        }

        $measurementSnapshot = json_decode($order->measurement_snapshot ?? '', true) ?: null;
        $style = json_decode($order->style ?? '', true) ?: null;

        foreach ($items as $idx => $item) {
            // Only the first price line carries the stitching metadata —
            // additional lines (e.g. "Fabric / Kapra") are plain charges on
            // the same garment, not separate stitched items. Preserves the
            // itemized Customer Bill breakdown rather than collapsing it.
            $isFirst = $idx === 0;

            DB::table('sale_items')->insert([
                'sale_id' => $saleId,
                'retail_product_variant_id' => null,
                'label' => $item['label'] ?? 'Stitching Charges',
                'qty' => 1,
                'unit_price' => $item['amount'] ?? 0,
                'line_total' => $item['amount'] ?? 0,
                'needs_stitching' => $isFirst,
                'measurement_template_key' => $isFirst ? ($measurementSnapshot['template_key'] ?? null) : null,
                'measurement_snapshot' => $isFirst && $measurementSnapshot ? json_encode($measurementSnapshot) : null,
                'style' => $isFirst && $style ? json_encode($style) : null,
                'karigar_id' => $isFirst ? $order->karigar_id : null,
                'deadline' => $isFirst ? $order->deadline : null,
                'item_status' => $isFirst ? $order->status : 'n_a',
                'delivered_date' => $isFirst ? $order->delivered_date : null,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
            ]);
        }
    }

    private function backfillRetailSale(object $retailSale): void
    {
        $saleId = DB::table('sales')->insertGetId([
            'legacy_retail_sale_id' => $retailSale->id,
            'customer_id' => null,
            'subtotal' => $retailSale->total_amount,
            'discount' => 0,
            'total' => $retailSale->total_amount,
            'status' => 'completed',
            'created_at' => $retailSale->created_at,
            'updated_at' => $retailSale->updated_at,
        ]);

        $items = DB::table('retail_sale_items')
            ->join('retail_product_variants', 'retail_product_variants.id', '=', 'retail_sale_items.retail_product_variant_id')
            ->join('retail_products', 'retail_products.id', '=', 'retail_product_variants.retail_product_id')
            ->where('retail_sale_items.retail_sale_id', $retailSale->id)
            ->get([
                'retail_sale_items.*',
                'retail_products.name as product_name',
                'retail_product_variants.size',
                'retail_product_variants.color',
            ]);

        foreach ($items as $item) {
            $variantBits = array_filter([$item->size, $item->color]);
            $label = $item->product_name.($variantBits ? ' ('.implode('/', $variantBits).')' : '');

            DB::table('sale_items')->insert([
                'sale_id' => $saleId,
                'retail_product_variant_id' => $item->retail_product_variant_id,
                'label' => $label,
                'qty' => $item->quantity,
                'unit_price' => $item->unit_price,
                'line_total' => $item->subtotal,
                'needs_stitching' => false,
                'item_status' => 'n_a',
                'created_at' => $retailSale->created_at,
                'updated_at' => $retailSale->updated_at,
            ]);
        }

        // Retail sales never wrote to payments at all — one payment row
        // for the full amount, using the real historical method (payments
        // .method gained 'card' specifically so this isn't lossy).
        DB::table('payments')->insert([
            'sale_id' => $saleId,
            'amount' => $retailSale->total_amount,
            'method' => $retailSale->payment_method,
            'date' => date('Y-m-d', strtotime($retailSale->sale_date)),
            'note' => 'Migrated from retail POS sale',
        ]);
    }
}
