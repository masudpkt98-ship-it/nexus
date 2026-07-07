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
            'owner' => $this->owner?->name,
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
