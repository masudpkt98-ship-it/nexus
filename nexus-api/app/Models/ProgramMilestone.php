<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramMilestone extends Model
{
    protected $fillable = ['milestone_id', 'program_code', 'name', 'due', 'status', 'progress', 'updated_by'];

    protected $casts = [
        'due' => 'date:Y-m-d',
        'progress' => 'integer',
    ];

    /** Reshape to the frontend Milestone contract (camelCase, client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->milestone_id,
            'programId' => $this->program_code,
            'name' => $this->name,
            'due' => optional($this->due)->format('Y-m-d'),
            'status' => $this->status,
            'progress' => $this->progress,
        ];
    }
}
