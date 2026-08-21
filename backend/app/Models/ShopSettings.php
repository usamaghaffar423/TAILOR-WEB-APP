<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopSettings extends Model
{
    public $table = 'shop_settings';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'logo_path',
        'banner_path',
        'theme_default',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
    ];
}
