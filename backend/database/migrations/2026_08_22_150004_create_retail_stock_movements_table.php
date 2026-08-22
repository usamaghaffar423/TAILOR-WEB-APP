<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retail_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retail_product_variant_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['PURCHASE_IN', 'SALE_OUT', 'ADJUSTMENT', 'RETURN']);
            $table->integer('quantity');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('note')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->index(['retail_product_variant_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retail_stock_movements');
    }
};
