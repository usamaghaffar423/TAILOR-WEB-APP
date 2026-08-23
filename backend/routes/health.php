<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    $dbStatus = 'error';
    $dbLatency = null;

    try {
        $start = microtime(true);
        DB::select('SELECT 1');
        $dbLatency = round((microtime(true) - $start) * 1000, 2);
        $dbStatus = 'ok';
    } catch (\Throwable $e) {
        $dbStatus = 'error';
    }

    return response()->json([
        'status' => $dbStatus === 'ok' ? 'ok' : 'degraded',
        'db_status' => $dbStatus,
        'db_latency' => $dbLatency,
        'php_version' => PHP_VERSION,
        'laravel' => app()->version(),
        'timestamp' => now()->toISOString(),
    ]);
});
