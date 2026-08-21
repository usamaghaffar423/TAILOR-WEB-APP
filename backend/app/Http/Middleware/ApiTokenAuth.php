<?php

namespace App\Http\Middleware;

use App\Models\Admin;
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

        $admin = Admin::query()->whereNotNull('api_token')->get()
            ->first(fn (Admin $candidate) => hash_equals($candidate->api_token, $hashed));

        if (! $admin) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->attributes->set('admin', $admin);

        return $next($request);
    }
}
