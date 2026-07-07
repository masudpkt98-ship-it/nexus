<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiInsight extends Model
{
    protected $fillable = ['type', 'title', 'body', 'confidence', 'position'];

    protected $casts = ['confidence' => 'integer', 'position' => 'integer'];
}
