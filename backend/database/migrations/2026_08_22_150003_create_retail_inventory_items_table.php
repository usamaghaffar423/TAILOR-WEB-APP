<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retail_inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retail_product_variant_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity_in_stock')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(5);
            $table->timestamp('last_restocked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retail_inventory_items');
    }
};
