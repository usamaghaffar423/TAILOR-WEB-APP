<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            // Null for backfilled legacy rows (they keep displaying their
            // original ORD-XXXX / retail sale id instead) — only sales
            // created after this migration's cutover get a real sale_no.
            $table->string('sale_no', 20)->unique()->nullable();
            // Traceability pointers back to the pre-migration tables, so a
            // backfilled row can always be reconciled with its source.
            // Neither is a real FK — the source tables are kept but retired,
            // not actively joined against going forward.
            $table->unsignedBigInteger('legacy_order_id')->nullable();
            $table->unsignedBigInteger('legacy_retail_sale_id')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained('customers');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->enum('status', ['in_progress', 'ready', 'delivered', 'completed'])->default('completed');
            $table->timestamps();
            $table->index('customer_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
