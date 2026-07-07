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
            'assignee' => $this->assignee?->name,
            'avatar' => $this->assignee?->avatar,
            'due' => optional($this->due_date)->format('Y-m-d'),
            'program' => $this->program?->code,
            'checklist' => [
                'total' => $this->checklist_total,
                'done' => $this->checklist_done,
            ],
            'comments' => $this->comments_count,
            'tags' => $this->tags ?? [],
        ];
    }
}
