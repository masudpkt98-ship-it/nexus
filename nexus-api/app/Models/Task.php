<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'title', 'description', 'status', 'priority', 'assignee_id',
        'program_id', 'due_date', 'checklist_total', 'checklist_done',
        'comments_count', 'tags',
    ];

    protected $casts = [
        'tags' => 'array',
        'due_date' => 'date:Y-m-d',
        'checklist_total' => 'integer',
        'checklist_done' => 'integer',
        'comments_count' => 'integer',
    ];

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }
}
