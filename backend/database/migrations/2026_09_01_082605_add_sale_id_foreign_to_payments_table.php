<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Split out from the order_id -> sale_id rename migration on purpose:
     * this FK can only be added AFTER the backfill command has remapped
     * every payments.sale_id from its legacy orders.id value to the real
     * new sales.id it belongs to. Run this migration only after that
     * backfill has completed and been verified.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_sale_id_foreign FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE payments DROP FOREIGN KEY payments_sale_id_foreign');
    }
};
