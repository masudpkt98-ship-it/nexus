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
        'category', 'business_value', 'effort_value', 'effort_unit',
        'requester', 'sprint', 'dependencies',
    ];

    protected $casts = [
        'tags' => 'array',
        'dependencies' => 'array',
        'due_date' => 'date:Y-m-d',
        'checklist_total' => 'integer',
        'checklist_done' => 'integer',
        'comments_count' => 'integer',
        'effort_value' => 'integer',
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
