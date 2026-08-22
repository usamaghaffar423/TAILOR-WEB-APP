<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retail_product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retail_product_id')->constrained()->cascadeOnDelete();
            $table->string('size', 20)->nullable();
            $table->string('color', 50)->nullable();
            $table->string('sku', 100)->unique()->nullable();
            $table->string('image_path', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retail_product_variants');
    }
};
