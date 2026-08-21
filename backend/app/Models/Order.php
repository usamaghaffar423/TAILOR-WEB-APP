<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_no',
        'customer_id',
        'style',
        'measurement_snapshot',
        'karigar_id',
        'assigned_date',
        'deadline',
        'status',
        'delivered_date',
        'total_amount',
    ];

    protected $casts = [
        'style' => 'array',
        'measurement_snapshot' => 'array',
        'assigned_date' => 'date',
        'deadline' => 'date',
        'delivered_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function karigar(): BelongsTo
    {
        return $this->belongsTo(Karigar::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(OrderPhoto::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
