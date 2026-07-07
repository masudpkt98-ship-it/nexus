<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => 'n'.$this->id,
            'channel' => $this->channel,
            'kind' => $this->kind,
            'title' => $this->title,
            'time' => $this->time_label,
            'read' => (bool) $this->read,
        ];
    }
}
