<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompassAssessmentRecord extends Model
{
    protected $fillable = ['record_id', 'employee', 'competency', 'method', 'assessor', 'score', 'status', 'date', 'updated_by'];

    protected $casts = ['score' => 'integer', 'date' => 'date:Y-m-d'];

    /** Reshape to the frontend AssessmentRecord contract. */
    public function toClient(): array
    {
        return [
            'id' => $this->record_id,
            'employee' => $this->employee,
            'competency' => $this->competency ?? '',
            'method' => $this->method,
            'assessor' => $this->assessor ?? '',
            // Stays null until graded — the UI shows "—" rather than a score of 0.
            'score' => $this->score,
            'status' => $this->status,
            'date' => optional($this->date)->format('Y-m-d') ?? '',
        ];
    }
}
