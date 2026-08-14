<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetencyLevel extends Model
{
    protected $fillable = ['level', 'name', 'description'];

    protected $casts = ['level' => 'integer'];

    /** Reshape to the frontend CompetencyLevelDef contract. */
    public function toClient(): array
    {
        return [
            'level' => $this->level,
            'name' => $this->name,
            'description' => $this->description ?? '',
        ];
    }
}
