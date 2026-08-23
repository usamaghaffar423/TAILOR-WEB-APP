<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderPhotosRequest;
use App\Models\Order;
use App\Models\OrderPhoto;
use App\Services\Cache\CacheBuster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class UploadController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
    {
    }

    public function store(StoreOrderPhotosRequest $request, int $orderId): JsonResponse
    {
        try {
            $order = Order::query()->find($orderId);

            if (! $order) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $photos = [];

            foreach ($request->file('files', []) as $file) {
                $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
                $file->storeAs("uploads/orders/{$orderId}", $filename, 'local');

                $relativePath = "orders/{$orderId}/{$filename}";

                $photos[] = OrderPhoto::query()->create([
                    'order_id' => $orderId,
                    'file_path' => $relativePath,
                ]);
            }

            // Order::show() eager-loads the photos relation, so its cache
            // entry is now stale.
            $this->cacheBuster->bustOrders();

            return response()->json(['data' => $photos, 'message' => 'Uploaded successfully.'], 201);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function serve(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $path = $request->query('path', '');

            if ($path === '' || str_contains($path, '..')) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $fullPath = "uploads/{$path}";

            if (! Storage::disk('local')->exists($fullPath)) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            return Storage::disk('local')->response($fullPath);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function destroy(Request $request, int $photoId): JsonResponse
    {
        try {
            $photo = OrderPhoto::query()->find($photoId);

            if (! $photo) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            Storage::disk('local')->delete("uploads/{$photo->file_path}");
            $photo->delete();

            $this->cacheBuster->bustOrders();

            return response()->json(['message' => 'Deleted successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }
}
