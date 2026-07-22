<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class PlanningKpi extends Model
{
    use Auditable;

    protected $table = 'planning_kpis';

    protected $fillable = [
        'kpi_id', 'unit_key', 'unit_name', 'directorate', 'compartment', 'period',
        'payload', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
