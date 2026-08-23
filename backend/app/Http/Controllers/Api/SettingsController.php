<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateSettingsRequest;
use App\Http\Requests\UpdateTemplateRequest;
use App\Http\Requests\UploadBannerRequest;
use App\Http\Requests\UploadLogoRequest;
use App\Models\MeasurementTemplate;
use App\Models\ShopSettings;
use App\Services\Cache\CacheBuster;
use App\Services\Cache\CacheKeys;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Throwable;

class SettingsController extends Controller
{
    public function __construct(private CacheBuster $cacheBuster)
    {
    }

    public function show(Request $request): JsonResponse
    {
        try {
            $settings = Cache::remember(
                CacheKeys::settings(),
                CacheKeys::SETTINGS_TTL,
                fn () => ShopSettings::query()->find(1)
            );

            return response()->json(['data' => $settings]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        try {
            $settings = ShopSettings::query()->find(1);

            $settings->update([
                'name' => $request->input('name'),
                'address' => $request->input('address'),
                'phone' => $request->input('phone'),
                'theme_default' => $request->input('theme_default'),
            ]);

            $this->cacheBuster->bustSettings();

            return response()->json(['data' => $settings, 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function uploadLogo(UploadLogoRequest $request): JsonResponse
    {
        try {
            $path = $this->storeShopImage($request->file('file'), 'logo');

            $settings = ShopSettings::query()->find(1);
            $settings->update(['logo_path' => $path]);

            $this->cacheBuster->bustSettings();

            return response()->json(['data' => ['logo_path' => $path], 'message' => 'Logo uploaded successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function uploadBanner(UploadBannerRequest $request): JsonResponse
    {
        try {
            $path = $this->storeShopImage($request->file('file'), 'banner');

            $settings = ShopSettings::query()->find(1);
            $settings->update(['banner_path' => $path]);

            $this->cacheBuster->bustSettings();

            return response()->json(['data' => ['banner_path' => $path], 'message' => 'Banner uploaded successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function getTemplates(Request $request): JsonResponse
    {
        try {
            $templates = Cache::remember(
                CacheKeys::templates(),
                CacheKeys::MEASUREMENT_TEMPLATES_TTL,
                fn () => MeasurementTemplate::query()->orderBy('label')->get()
            );

            return response()->json(['data' => $templates]);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function updateTemplate(UpdateTemplateRequest $request, string $key): JsonResponse
    {
        try {
            $template = MeasurementTemplate::query()->where('template_key', $key)->first();

            if (! $template) {
                return response()->json(['message' => 'Not found.'], 404);
            }

            $template->update([
                'label' => $request->input('label'),
                'fields' => $request->input('fields'),
            ]);

            $this->cacheBuster->bustTemplates();

            return response()->json(['data' => $template, 'message' => 'Updated successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function clearCache(Request $request): JsonResponse
    {
        try {
            Cache::flush();

            return response()->json(['message' => 'Cache cleared successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $admin = $request->attributes->get('admin');

            if (! Hash::check($request->input('current_password'), $admin->password_hash)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }

            $admin->password_hash = bcrypt($request->input('new_password'));
            $admin->save();

            return response()->json(['message' => 'Password changed successfully.']);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Server error.'], 500);
        }
    }

    private function storeShopImage($file, string $baseName): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename = $baseName.'.'.$extension;
        // Must match the disk UploadController::serve() reads from ('local'),
        // not 'public' — the two disks have different root directories, so a
        // file saved to one is invisible to a lookup against the other.
        $file->storeAs('uploads/shop', $filename, 'local');

        return 'shop/'.$filename;
    }
}
