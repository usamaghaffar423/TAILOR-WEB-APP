<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    public $table = 'admin';

    protected $fillable = [
        'email',
        'password_hash',
        'api_token',
        'shop_name',
    ];

    protected $hidden = [
        'password_hash',
        'api_token',
    ];
}
