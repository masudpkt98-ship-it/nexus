<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Competency extends Model
{
    protected $fillable = ['name', 'category', 'required_level', 'current_level'];

    protected $casts = [
        'required_level' => 'integer',
        'current_level' => 'integer',
    ];
}
