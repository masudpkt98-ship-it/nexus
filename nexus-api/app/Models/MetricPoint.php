<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MetricPoint extends Model
{
    protected $fillable = ['series', 'label', 'value', 'position'];

    protected $casts = ['value' => 'float', 'position' => 'integer'];
}
