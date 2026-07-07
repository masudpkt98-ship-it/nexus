<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => 'a'.$this->id,
            'user' => $this->actor,
            'action' => $this->action,
            'target' => $this->target,
            'type' => $this->type,
            'time' => optional($this->created_at)->diffForHumans(null, true),
        ];
    }
}
