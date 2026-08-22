<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retail_sales', function (Blueprint $table) {
            $table->id();
            $table->timestamp('sale_date')->useCurrent();
            $table->decimal('total_amount', 10, 2);
            $table->enum('payment_method', ['cash', 'card', 'easypaisa', 'jazzcash'])->default('cash');
            $table->string('customer_name', 255)->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retail_sales');
    }
};
