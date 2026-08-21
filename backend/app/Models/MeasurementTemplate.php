<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MeasurementTemplate extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'template_key',
        'label',
        'fields',
    ];

    protected $casts = [
        'fields' => 'array',
        'updated_at' => 'datetime',
    ];
}
