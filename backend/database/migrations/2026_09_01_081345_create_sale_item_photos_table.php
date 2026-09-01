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
        // Mirrors order_photos exactly — reference-photo upload on a
        // stitched line is a real, actively-used feature of the old New
        // Order flow and needs an equivalent home in the unified cart.
        Schema::create('sale_item_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_item_id')->constrained('sale_items')->onDelete('cascade');
            $table->string('file_path', 500);
            $table->timestamp('uploaded_at')->useCurrent();
            $table->index('sale_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_item_photos');
    }
};
