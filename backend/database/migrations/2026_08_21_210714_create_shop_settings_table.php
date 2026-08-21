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
        Schema::create('shop_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('name', 255)->default('Top Man Tailor');
            $table->string('address', 500)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('logo_path', 500)->nullable();
            $table->string('banner_path', 500)->nullable();
            $table->enum('theme_default', ['dark', 'light'])->default('dark');
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_settings');
    }
};
