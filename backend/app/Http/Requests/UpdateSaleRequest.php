<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Same philosophy as the legacy Edit Order dialog: customer,
            // measurements, and photos stay locked to what was captured at
            // sale time — only karigar/deadline/status/style per line item
            // are editable here, plus a sale-level status override.
            'status' => ['sometimes', 'in:in_progress,ready,delivered,completed'],
            'items' => ['sometimes', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:sale_items,id'],
            'items.*.karigar_id' => ['nullable', 'integer', 'exists:karigars,id'],
            'items.*.deadline' => ['nullable', 'date'],
            'items.*.item_status' => ['nullable', 'in:n_a,progress,ready,delivered'],
            'items.*.style' => ['nullable', 'array'],
        ];
    }
}
