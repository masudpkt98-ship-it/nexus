<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'dbId' => $this->id,
            'title' => $this->title,
            'requester' => $this->requester,
            'priority' => $this->priority,
            'sla' => $this->sla,
            'status' => $this->status,
            'pic' => $this->pic ?? $this->picUser?->name,
            'created' => optional($this->created_at)->format('Y-m-d'),
        ];
    }
}
