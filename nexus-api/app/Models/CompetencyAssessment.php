<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetencyAssessment extends Model
{
    protected $fillable = ['group_key', 'npk', 'name', 'levels', 'updated_by'];

    protected $casts = ['levels' => 'array'];

    /** Reshape to the frontend MatrixEmployee contract. */
    public function toClient(): array
    {
        return [
            'npk' => $this->npk,
            'name' => $this->name,
            'levels' => (object) ($this->levels ?? []),
        ];
    }
}
