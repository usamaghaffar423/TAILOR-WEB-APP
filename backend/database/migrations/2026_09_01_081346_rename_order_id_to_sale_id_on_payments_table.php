<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Raw SQL throughout — doctrine/dbal isn't installed, and this
        // avoids depending on it for a rename + enum change on a live
        // production table. Constraint name confirmed against production
        // (payments_order_id_foreign) before writing this.
        DB::statement('ALTER TABLE payments DROP FOREIGN KEY payments_order_id_foreign');
        DB::statement('ALTER TABLE payments RENAME COLUMN order_id TO sale_id');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_sale_id_foreign FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE');

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
        DB::statement('ALTER TABLE payments DROP FOREIGN KEY payments_sale_id_foreign');
        DB::statement('ALTER TABLE payments RENAME COLUMN sale_id TO order_id');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_order_id_foreign FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE');
    }
};
