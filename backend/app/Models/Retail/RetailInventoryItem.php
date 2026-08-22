<?php

namespace App\Models\Retail;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetailInventoryItem extends Model
{
    protected $fillable = [
        'retail_product_variant_id',
        'quantity_in_stock',
        'low_stock_threshold',
        'last_restocked_at',
    ];

    protected $appends = ['is_low_stock'];

    protected function casts(): array
    {
        return [
            'last_restocked_at' => 'datetime',
        ];
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(RetailProductVariant::class, 'retail_product_variant_id');
    }

    protected function isLowStock(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->quantity_in_stock <= $this->low_stock_threshold,
        );
    }
}
