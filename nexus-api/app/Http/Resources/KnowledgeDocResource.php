<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KnowledgeDocResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => 'D'.$this->id,
            'title' => $this->title,
            'category' => $this->category,
            'version' => $this->version,
            'type' => $this->type,
            'approval' => $this->approval,
            'owner' => $this->owner,
            'updated' => optional($this->updated_on)->format('Y-m-d'),
        ];
    }
}
