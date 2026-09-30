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
            // An order can be moved to a different customer — that is the only
            // way to split a record the old phone-dedup overwrite collapsed
            // two people into (see OrderController::update()).
            'customer_id' => ['sometimes', 'integer', 'exists:customers,id'],
            'karigar_id' => ['required', 'integer', 'exists:karigars,id'],
            'assigned_date' => ['sometimes', 'date'],
            'deadline' => ['required', 'date'],
            'status' => ['required', 'in:progress,ready,delivered'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'style' => ['sometimes', 'array'],
            'items' => ['sometimes', 'array'],
            'items.*.label' => ['required_with:items', 'string'],
            'items.*.amount' => ['required_with:items', 'numeric', 'min:0'],
            // A mis-entered order can be corrected in full — garment,
            // measurements and notes included, not just assignment/billing.
            'template_key' => ['sometimes', 'string', 'exists:measurement_templates,template_key'],
            'measurement_fields' => ['sometimes', 'array'],
            'measurement_notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
