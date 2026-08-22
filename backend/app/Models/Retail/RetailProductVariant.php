<?php

namespace App\Models\Retail;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RetailProductVariant extends Model
{
    protected $fillable = [
        'retail_product_id',
        'size',
        'color',
        'sku',
        'image_path',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(RetailProduct::class, 'retail_product_id');
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(RetailInventoryItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(RetailStockMovement::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(RetailSaleItem::class);
    }
}
