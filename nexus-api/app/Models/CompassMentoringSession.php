<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompassMentoringSession extends Model
{
    protected $fillable = ['session_id', 'employee', 'mentor', 'kind', 'topic', 'notes', 'action_plan', 'date', 'updated_by'];

    protected $casts = ['date' => 'date:Y-m-d'];

    /** Reshape to the frontend MentoringSession contract. */
    public function toClient(): array
    {
        return [
            'id' => $this->session_id,
            'employee' => $this->employee,
            'mentor' => $this->mentor ?? '',
            'kind' => $this->kind,
            'topic' => $this->topic ?? '',
            'notes' => $this->notes ?? '',
            'actionPlan' => $this->action_plan ?? '',
            'date' => optional($this->date)->format('Y-m-d') ?? '',
        ];
    }
}
