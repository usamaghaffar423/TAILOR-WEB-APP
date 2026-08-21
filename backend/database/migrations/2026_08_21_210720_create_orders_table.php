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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no', 20)->unique();
            $table->foreignId('customer_id')->constrained('customers');
            $table->json('style');
            $table->json('measurement_snapshot');
            $table->foreignId('karigar_id')->constrained('karigars');
            $table->date('assigned_date');
            $table->date('deadline');
            $table->enum('status', ['progress', 'ready', 'delivered'])->default('progress');
            $table->date('delivered_date')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->timestamps();
            $table->index('customer_id');
            $table->index('karigar_id');
            $table->index('status');
            $table->index('deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
