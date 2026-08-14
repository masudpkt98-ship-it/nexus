<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingSession extends Model
{
    protected $fillable = ['session_id', 'name', 'date', 'seats', 'position', 'updated_by'];

    /** Reshape to the frontend TrainingSession contract (client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->session_id,
            'name' => $this->name,
            'date' => $this->date ?? '',
            'seats' => $this->seats ?? '',
        ];
    }
}
