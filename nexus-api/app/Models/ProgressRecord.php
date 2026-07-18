<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgressRecord extends Model
{
    protected $fillable = [
        'period_id', 'year', 'gran', 'value', 'npk', 'name', 'position',
        'unit', 'directorate', 'compartment', 'metrics', 'period_label', 'published_at',
    ];

    protected $casts = [
        'year' => 'integer',
        'value' => 'integer',
        'metrics' => 'array',
        'published_at' => 'datetime',
    ];
}
