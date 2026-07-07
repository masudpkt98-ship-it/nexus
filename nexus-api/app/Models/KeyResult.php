<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KeyResult extends Model
{
    protected $fillable = ['objective_id', 'title', 'progress'];

    protected $casts = ['progress' => 'integer'];

    public function objective(): BelongsTo
    {
        return $this->belongsTo(Objective::class);
    }
}
