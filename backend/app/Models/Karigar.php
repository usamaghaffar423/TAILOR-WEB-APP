<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Karigar extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'speciality',
        'max_capacity',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
