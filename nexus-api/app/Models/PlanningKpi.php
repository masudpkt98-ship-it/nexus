<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanningKpi extends Model
{
    protected $table = 'planning_kpis';

    protected $fillable = [
        'kpi_id', 'unit_key', 'unit_name', 'directorate', 'period',
        'payload', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
