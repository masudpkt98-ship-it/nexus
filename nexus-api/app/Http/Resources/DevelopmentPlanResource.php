<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevelopmentPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            // The client id the hub upserts against — never the auto-increment id.
            'id' => $this->plan_id,
            'employee' => $this->employee,
            'avatar' => $this->avatar,
            'role' => $this->role,
            'readiness' => $this->readiness,
            'gaps' => $this->gaps,
            'nextStep' => $this->next_step,
        ];
    }
}
