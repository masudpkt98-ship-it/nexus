<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompassLmsModule extends Model
{
    protected $fillable = ['module_id', 'title', 'competency', 'type', 'duration', 'level', 'updated_by'];

    protected $casts = ['level' => 'integer'];

    /** Reshape to the frontend LmsModule contract. */
    public function toClient(): array
    {
        return [
            'id' => $this->module_id,
            'title' => $this->title,
            'competency' => $this->competency ?? '',
            'type' => $this->type,
            'duration' => $this->duration ?? '',
            'level' => $this->level,
        ];
    }
}
