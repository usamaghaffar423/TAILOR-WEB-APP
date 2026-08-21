<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreKarigarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'speciality' => ['nullable', 'string', 'max:255'],
            'max_capacity' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
