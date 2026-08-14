<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // The client id the page upserts against — never the auto-increment id.
            'id' => $this->meeting_id,
            'title' => $this->title,
            'time' => $this->scheduled_label,
            'attendees' => $this->attendees,
            'actionItems' => $this->action_items,
        ];
    }
}
