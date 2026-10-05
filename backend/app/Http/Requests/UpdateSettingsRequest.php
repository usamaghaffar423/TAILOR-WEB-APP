<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Partial updates only: the settings screen PUTs {name,phone,address}
        // from "Save Shop Details" and {theme_default} from the theme chip as
        // two separate payloads, so each field is validated only when sent —
        // requiring both made every partial payload fail with a 422.
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'theme_default' => ['sometimes', 'required', 'in:dark,light'],
        ];
    }
}
