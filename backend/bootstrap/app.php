<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')->prefix('api')->group(base_path('routes/retail.php'));

            // Health dashboard ping — public, no auth middleware (PIN gate is frontend-only).
            Route::prefix('api')->group(base_path('routes/health.php'));
        },
    )
    ->withSchedule(function (Schedule $schedule) {
        // Belt-and-braces cache reset — normal writes already bust the
        // specific keys they invalidate; this just clears anything
        // orphaned (e.g. an admin who edited storage/cache files by hand).
        $schedule->command('cache:flush-app')->cron('0 3 */3 * *');
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'api.auth' => \App\Http\Middleware\ApiTokenAuth::class,
        ]);

        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Not found.'], 404);
            }
        });
    })->create();
