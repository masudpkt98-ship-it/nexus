<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Objective extends Model
{
    use SoftDeletes;

    protected $fillable = ['title', 'owner_id', 'progress', 'quarter'];

    protected $casts = ['progress' => 'integer'];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function keyResults(): HasMany
    {
        return $this->hasMany(KeyResult::class);
    }
}
