<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Structural checks only — the business rule "customer_id is
            // required once any item needs_stitching" is enforced in
            // SaleController before this validated data reaches the
            // service, since Laravel's wildcard required_if doesn't cover
            // that "any item in the array" shape.
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.retail_product_variant_id' => ['nullable', 'integer', 'exists:retail_product_variants,id'],
            'items.*.label' => ['required', 'string', 'max:255'],
            'items.*.recipient_name' => ['nullable', 'string', 'max:255'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.needs_stitching' => ['sometimes', 'boolean'],
            'items.*.template_key' => ['nullable', 'string'],
            'items.*.style' => ['nullable', 'array'],
            'items.*.karigar_id' => ['nullable', 'integer', 'exists:karigars,id'],
            'items.*.deadline' => ['nullable', 'date'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:in_progress,ready,delivered,completed'],
            'advance_amount' => ['nullable', 'numeric', 'min:0'],
            'advance_method' => ['required_with:advance_amount', 'in:cash,easypaisa,jazzcash,bank,card'],
            'advance_date' => ['nullable', 'date'],
            'advance_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
