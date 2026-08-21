<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'template_key' => ['required', 'string'],
            'karigar_id' => ['required', 'integer', 'exists:karigars,id'],
            'style' => ['required', 'array'],
            'deadline' => ['required', 'date'],
            'status' => ['nullable', 'in:progress,ready,delivered'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'advance_amount' => ['nullable', 'numeric', 'min:0'],
            'advance_method' => ['required_with:advance_amount', 'in:cash,easypaisa,jazzcash,bank'],
            'advance_date' => ['nullable', 'date'],
            'advance_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
