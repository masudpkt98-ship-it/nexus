<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'dbId' => $this->id,
            'name' => $this->name,
            // The form's free-text owner wins; the linked user is the fallback.
            'owner' => $this->owner_name ?? $this->owner?->name,
            'goalIds' => $this->goal_ids ?? [],
            'okrIds' => $this->okr_ids ?? [],
            'status' => $this->status,
            'progress' => $this->progress,
            'budget' => $this->budget,
            'spent' => $this->spent,
            'risk' => $this->risk,
            'milestones' => $this->milestones,
            'milestonesDone' => $this->milestones_done,
            'start' => optional($this->start_date)->format('Y-m-d'),
            'end' => optional($this->end_date)->format('Y-m-d'),
        ];
    }
}
