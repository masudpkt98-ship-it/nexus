<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobProfile extends Model
{
    protected $fillable = [
        'profile_id', 'role', 'level', 'unit', 'purpose',
        'responsibilities', 'kpi_ids', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'responsibilities' => 'array',
        'kpi_ids' => 'array',
    ];

    /** Reshape to the frontend JobProfile contract (client id + camelCase). */
    public function toClient(): array
    {
        return [
            'id' => $this->profile_id,
            'role' => $this->role,
            'level' => $this->level,
            'unit' => $this->unit,
            'purpose' => $this->purpose,
            'responsibilities' => $this->responsibilities ?? [],
            'kpiIds' => $this->kpi_ids ?? [],
        ];
    }
}
