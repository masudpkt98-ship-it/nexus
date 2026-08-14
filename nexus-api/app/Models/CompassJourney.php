<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompassJourney extends Model
{
    protected $fillable = ['journey_id', 'employee', 'role', 'weeks', 'progress', 'updated_by'];

    protected $casts = ['weeks' => 'array', 'progress' => 'integer'];

    /** Reshape to the frontend LearningJourney contract. */
    public function toClient(): array
    {
        return [
            'id' => $this->journey_id,
            'employee' => $this->employee,
            'role' => $this->role ?? '',
            'weeks' => $this->weeks ?? [],
            'progress' => $this->progress,
        ];
    }
}
