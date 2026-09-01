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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            // Reuses the existing retail catalog as-is — nullable because a
            // stitched-only line (no off-the-shelf product) or a plain
            // manual charge line (e.g. "Fabric / Kapra") has none.
            $table->foreignId('retail_product_variant_id')->nullable()
                ->constrained('retail_product_variants')->onDelete('restrict');
            $table->string('label', 255);
            $table->string('recipient_name', 255)->nullable();
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('line_total', 10, 2);

            // Stitching sub-fields — only populated when needs_stitching.
            $table->boolean('needs_stitching')->default(false);
            $table->string('measurement_template_key', 60)->nullable();
            // Same shape as the legacy orders.measurement_snapshot column:
            // {template_key, template_label, fields, notes}.
            $table->json('measurement_snapshot')->nullable();
            // Same shape as the legacy orders.style column, including the
            // custom_fields sub-key.
            $table->json('style')->nullable();
            $table->foreignId('karigar_id')->nullable()->constrained('karigars')->onDelete('restrict');
            $table->date('deadline')->nullable();
            $table->enum('item_status', ['n_a', 'progress', 'ready', 'delivered'])->default('n_a');
            $table->date('delivered_date')->nullable();

            $table->timestamps();
            $table->index('sale_id');
            $table->index('karigar_id');
            $table->index('item_status');
            $table->index('deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
