<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\KarigarController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('api.auth')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/password', [SettingsController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::get('/customers/{id}/measurements', [CustomerController::class, 'getMeasurements']);
    Route::put('/customers/{id}/measurements/{templateKey}', [CustomerController::class, 'upsertMeasurement']);

    // Karigars
    Route::get('/karigars', [KarigarController::class, 'index']);
    Route::post('/karigars', [KarigarController::class, 'store']);
    Route::get('/karigars/{id}', [KarigarController::class, 'show']);
    Route::put('/karigars/{id}', [KarigarController::class, 'update']);
    Route::delete('/karigars/{id}', [KarigarController::class, 'destroy']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

    // Sales (unified Sale/Bill migration — new, additive; orders/ above stays
    // fully intact and unused for now, archived once this is cut over).
    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);
    Route::put('/sales/{id}', [SaleController::class, 'update']);
    Route::delete('/sales/{id}', [SaleController::class, 'destroy']);
    Route::patch('/sales/items/{itemId}/status', [SaleController::class, 'updateItemStatus']);

    // Payments
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/payments/summary', [PaymentController::class, 'summary']);
    Route::get('/payments/balances', [PaymentController::class, 'balances']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/settings/logo', [SettingsController::class, 'uploadLogo']);
    Route::post('/settings/banner', [SettingsController::class, 'uploadBanner']);
    Route::get('/templates', [SettingsController::class, 'getTemplates']);
    Route::put('/templates/{key}', [SettingsController::class, 'updateTemplate']);
    Route::post('/settings/clear-cache', [SettingsController::class, 'clearCache']);

    // Uploads
    Route::post('/uploads/order/{id}', [UploadController::class, 'store']);
    // Path is a query param (not a URL segment) so the request URL never ends
    // in an image extension — Hostinger's edge CDN otherwise intercepts any
    // /api/* path ending in .jpg/.png before it reaches Laravel, skipping
    // the CORS middleware entirely and breaking cross-origin image fetches.
    Route::get('/uploads', [UploadController::class, 'serve']);
    Route::delete('/uploads/{photoId}', [UploadController::class, 'destroy']);
});
