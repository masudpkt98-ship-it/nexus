<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StrategyGoal extends Model
{
    protected $fillable = [
        'goal_id', 'code', 'division', 'title', 'target', 'owner',
        'description', 'strategies', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'strategies' => 'array',
    ];

    /** Reshape to the frontend StrategicGoal contract (client id + camelCase). */
    public function toClient(): array
    {
        return [
            'id' => $this->goal_id,
            'code' => $this->code,
            'division' => $this->division,
            'title' => $this->title,
            'target' => $this->target,
            'owner' => $this->owner,
            'description' => $this->description,
            'strategies' => $this->strategies ?? [],
        ];
    }
}
