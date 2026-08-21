<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\Admin;
use App\Models\ShopSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Throwable;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $admin = Admin::query()->where('email', $request->input('email'))->first();

            if (! $admin || ! Hash::check($request->input('password'), $admin->password_hash)) {
                return response()->json(['message' => 'Invalid credentials.'], 401);
            }

            $plainToken = bin2hex(random_bytes(32));
            $admin->api_token = hash('sha256', $plainToken);
            $admin->save();

            return response()->json([
                'data' => [
                    'token' => $plainToken,
                    'admin' => $admin,
                ],
                'message' => 'Login successful.',
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $admin = $request->attributes->get('admin');
            $admin->api_token = null;
            $admin->save();

            return response()->json(['message' => 'Logged out successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function me(Request $request): JsonResponse
    {
        try {
            $shop = ShopSettings::query()->find(1);

            return response()->json([
                'data' => [
                    'admin' => $request->attributes->get('admin'),
                    'shop' => $shop,
                ],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
