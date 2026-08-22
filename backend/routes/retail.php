<?php

use App\Http\Controllers\Retail\RetailDashboardController;
use App\Http\Controllers\Retail\RetailInventoryController;
use App\Http\Controllers\Retail\RetailProductController;
use App\Http\Controllers\Retail\RetailSaleController;
use App\Http\Controllers\Retail\RetailVariantController;
use Illuminate\Support\Facades\Route;

Route::middleware('api.auth')->prefix('retail')->group(function () {

    // Dashboard summary
    Route::get('/dashboard', [RetailDashboardController::class, 'summary']);

    // Products
    Route::get('/products', [RetailProductController::class, 'index']);
    Route::post('/products', [RetailProductController::class, 'store']);
    Route::get('/products/{id}', [RetailProductController::class, 'show']);
    Route::put('/products/{id}', [RetailProductController::class, 'update']);
    Route::delete('/products/{id}', [RetailProductController::class, 'destroy']);

    // Variants
    Route::post('/products/{productId}/variants', [RetailVariantController::class, 'store']);
    Route::post('/variants/{variantId}/image', [RetailVariantController::class, 'uploadImage']);
    Route::delete('/variants/{variantId}', [RetailVariantController::class, 'destroy']);

    // Inventory
    Route::get('/inventory', [RetailInventoryController::class, 'index']);
    Route::post('/inventory/{variantId}/restock', [RetailInventoryController::class, 'restock']);
    Route::post('/inventory/{variantId}/adjust', [RetailInventoryController::class, 'adjust']);
    Route::get('/inventory/{variantId}/movements', [RetailInventoryController::class, 'movements']);

    // Sales (POS)
    Route::get('/sales', [RetailSaleController::class, 'index']);
    Route::post('/sales', [RetailSaleController::class, 'store']);
    Route::get('/sales/{id}', [RetailSaleController::class, 'show']);
});
