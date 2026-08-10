<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CorporateKpi extends Model
{
    protected $fillable = [
        'kpi_id', 'code', 'name', 'perspective', 'unit', 'target',
        'strategic_goal_id', 'cascadable_to', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'cascadable_to' => 'array',
    ];

    /** Reshape to the frontend CorporateKpi contract (camelCase, client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->kpi_id,
            'code' => $this->code,
            'name' => $this->name,
            'perspective' => $this->perspective,
            'unit' => $this->unit,
            'target' => $this->target,
            'strategicGoalId' => $this->strategic_goal_id,
            'cascadableTo' => $this->cascadable_to ?? [],
        ];
    }
}
