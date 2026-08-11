<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'dbId' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'assignee' => $this->assignee_name ?? $this->assignee?->name,
            'avatar' => $this->avatar ?? $this->assignee?->avatar,
            'due' => optional($this->due_date)->format('Y-m-d'),
            'program' => $this->program_ref ?? $this->program?->code,
            'milestoneId' => $this->milestone_id,
            'checklist' => [
                'total' => $this->checklist_total,
                'done' => $this->checklist_done,
            ],
            'comments' => $this->comments_count,
            'tags' => $this->tags ?? [],
            // Backlog attributes (Task.png / BusinessValue.png)
            'description' => $this->description,
            'category' => $this->category,
            'businessValue' => $this->business_value,
            'effortValue' => $this->effort_value,
            'effortUnit' => $this->effort_unit,
            'requester' => $this->requester,
            'sprint' => $this->sprint,
            'dependencies' => $this->dependencies ?? [],
            'subtasks' => $this->subtasks ?? [],
            'evidence' => $this->evidence ?? [],
            'createdAt' => optional($this->created_at)->format('Y-m-d'),
        ];
    }
}
