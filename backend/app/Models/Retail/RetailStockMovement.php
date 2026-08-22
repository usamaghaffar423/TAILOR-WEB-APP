<?php

namespace App\Models\Retail;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetailStockMovement extends Model
{
    protected $fillable = [
        'retail_product_variant_id',
        'type',
        'quantity',
        'reference_id',
        'note',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => 'string',
        ];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(RetailProductVariant::class, 'retail_product_variant_id');
    }
}
