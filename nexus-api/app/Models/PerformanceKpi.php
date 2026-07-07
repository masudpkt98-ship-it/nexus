<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PerformanceKpi extends Model
{
    protected $fillable = ['code', 'name', 'level', 'weight', 'target', 'actual', 'unit'];

    protected $casts = [
        'weight' => 'integer',
        'target' => 'float',
        'actual' => 'float',
    ];
}
