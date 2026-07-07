<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ObjectiveResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => 'okr-'.$this->id,
            'title' => $this->title,
            'owner' => $this->owner?->name,
            'progress' => $this->progress,
            'quarter' => $this->quarter,
            'keyResults' => $this->keyResults->map(fn ($kr) => [
                'title' => $kr->title,
                'progress' => $kr->progress,
            ]),
        ];
    }
}
