<?php

namespace App\Models\Retail;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetailSaleItem extends Model
{
    protected $fillable = [
        'retail_sale_id',
        'retail_product_variant_id',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(RetailSale::class, 'retail_sale_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(RetailProductVariant::class, 'retail_product_variant_id');
    }
}
