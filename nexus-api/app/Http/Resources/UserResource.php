<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => 'u-'.str_pad((string) $this->id, 3, '0', STR_PAD_LEFT),
            'name' => $this->name,
            'role' => $this->role,
            'title' => $this->title,
            'avatar' => $this->avatar,
            'email' => $this->email,
            'permissions' => $this->permissions(),
        ];
    }
}
