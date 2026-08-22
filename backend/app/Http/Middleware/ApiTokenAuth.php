<?php

namespace App\Http\Middleware;

use App\Models\AdminToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $hashed = hash('sha256', $token);

        $adminToken = AdminToken::query()->where('token', $hashed)->with('admin')->first();

        if (! $adminToken || ! $adminToken->admin) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $adminToken->update(['last_used_at' => now()]);

        $request->attributes->set('admin', $adminToken->admin);
        $request->attributes->set('adminToken', $adminToken);

        return $next($request);
    }
}
