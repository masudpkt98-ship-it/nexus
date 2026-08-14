<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompassCertification extends Model
{
    protected $fillable = ['cert_id', 'employee', 'title', 'level', 'status', 'issued', 'expires', 'updated_by'];

    protected $casts = ['issued' => 'date:Y-m-d', 'expires' => 'date:Y-m-d'];

    /** Reshape to the frontend CertificationRecord contract. */
    public function toClient(): array
    {
        return [
            'id' => $this->cert_id,
            'employee' => $this->employee,
            'title' => $this->title,
            'level' => $this->level ?? '',
            'status' => $this->status,
            'issued' => optional($this->issued)->format('Y-m-d') ?? '',
            'expires' => optional($this->expires)->format('Y-m-d'),
        ];
    }
}
