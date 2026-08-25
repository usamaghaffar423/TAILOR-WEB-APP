<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'karigar_id' => ['required', 'integer', 'exists:karigars,id'],
            'deadline' => ['required', 'date'],
            'status' => ['required', 'in:progress,ready,delivered'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'style' => ['sometimes', 'array'],
        ];
    }
}
