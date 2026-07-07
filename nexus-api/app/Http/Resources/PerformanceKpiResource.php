<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PerformanceKpiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'name' => $this->name,
            'level' => $this->level,
            'weight' => $this->weight,
            'target' => (float) $this->target,
            'actual' => (float) $this->actual,
            'unit' => $this->unit,
        ];
    }
}
