<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Program extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'name', 'owner_id', 'owner_name', 'status', 'progress', 'budget', 'spent',
        'risk', 'milestones', 'milestones_done', 'start_date', 'end_date', 'goal_ids', 'okr_ids',
    ];

    protected $casts = [
        'progress' => 'integer',
        'budget' => 'integer',
        'spent' => 'integer',
        'milestones' => 'integer',
        'milestones_done' => 'integer',
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'goal_ids' => 'array',
        'okr_ids' => 'array',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
