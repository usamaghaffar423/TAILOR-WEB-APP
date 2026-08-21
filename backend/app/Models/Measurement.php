<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Measurement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'customer_id',
        'template_key',
        'fields',
        'notes',
    ];

    protected $casts = [
        'fields' => 'array',
        'updated_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
