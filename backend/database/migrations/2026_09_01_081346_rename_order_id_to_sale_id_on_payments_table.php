<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Deliberately does NOT add the sale_id -> sales.id foreign key here.
     * Right after this rename, sale_id still holds the OLD orders.id values
     * (a bare rename doesn't change data) — those aren't valid sales.id
     * values yet, since sales rows don't exist until the backfill command
     * runs. Adding the FK now fails with an integrity-constraint error
     * (confirmed against production). The backfill command remaps every
     * payments.sale_id from its legacy order id to the real new sales.id,
     * and only THEN does a separate later migration add the FK.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE payments DROP FOREIGN KEY payments_order_id_foreign');
        DB::statement('ALTER TABLE payments RENAME COLUMN order_id TO sale_id');

        // Retail sales already support a "card" payment method that the
        // tailoring side's payments table never had — needed to faithfully
        // backfill retail payment history instead of lossily mapping it to
        // "cash".
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('cash','easypaisa','jazzcash','bank','card') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN method ENUM('cash','easypaisa','jazzcash','bank') NOT NULL");
        DB::statement('ALTER TABLE payments RENAME COLUMN sale_id TO order_id');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_order_id_foreign FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE');
    }
};
