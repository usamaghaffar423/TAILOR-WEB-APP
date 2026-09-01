<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Order extends Model
{
    protected $fillable = [
        'order_no',
        'customer_id',
        'style',
        'items',
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
        'items' => 'array',
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

    /**
     * payments.order_id was renamed to sale_id and repointed at the new
     * sales table (see the Sale/Bill unification migration) — a payment
     * for this order now lives one hop further out, bridged through
     * sales.legacy_order_id. Every order (old and new, until Order Studio
     * is cut over) has exactly one mirrored sales row for this bridge to
     * resolve through — see OrderController::store()/update()/destroy().
     */
    public function payments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Payment::class,
            Sale::class,
            'legacy_order_id', // FK on sales referencing orders.id
            'sale_id',         // FK on payments referencing sales.id
            'id',              // local key on orders
            'id'               // local key on sales
        );
    }
}
