<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TopPerformer extends Model
{
    protected $fillable = ['perf_id', 'name', 'avatar', 'role', 'score', 'updated_by'];

    protected $casts = ['score' => 'integer'];

    /** Reshape to the frontend Perf contract (client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->perf_id,
            'name' => $this->name,
            'avatar' => $this->avatar ?? '',
            'role' => $this->role ?? '—',
            'score' => $this->score,
        ];
    }
}
