<?php

namespace App\Models;

use App\Models\Retail\RetailProductVariant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'retail_product_variant_id',
        'label',
        'recipient_name',
        'qty',
        'unit_price',
        'line_total',
        'needs_stitching',
        'measurement_template_key',
        'measurement_snapshot',
        'style',
        'karigar_id',
        'deadline',
        'item_status',
        'delivered_date',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'needs_stitching' => 'boolean',
        'measurement_snapshot' => 'array',
        'style' => 'array',
        'deadline' => 'date',
        'delivered_date' => 'date',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(RetailProductVariant::class, 'retail_product_variant_id');
    }

    public function karigar(): BelongsTo
    {
        return $this->belongsTo(Karigar::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(SaleItemPhoto::class);
    }
}
