<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => 'M'.$this->id,
            'title' => $this->title,
            'time' => $this->scheduled_label,
            'attendees' => $this->attendees,
            'actionItems' => $this->action_items,
        ];
    }
}
