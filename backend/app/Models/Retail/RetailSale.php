<?php

namespace App\Models\Retail;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RetailSale extends Model
{
    protected $fillable = [
        'sale_date',
        'total_amount',
        'payment_method',
        'customer_name',
        'customer_phone',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'sale_date' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(RetailSaleItem::class);
    }
}
