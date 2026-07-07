<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SatisfactionService extends Model
{
    protected $fillable = ['service', 'score', 'position'];

    protected $casts = ['score' => 'float', 'position' => 'integer'];
}
