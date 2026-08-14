<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SatisfactionService extends Model
{
    protected $fillable = ['service_id', 'service', 'score', 'position'];

    protected $casts = ['score' => 'float', 'position' => 'integer'];

    /** Guarantee a client id however the row was created (seeder included). */
    protected static function booted(): void
    {
        static::creating(function (self $s) {
            if (blank($s->service_id)) {
                $s->service_id = 'svc-'.str()->random(8);
            }
        });
    }

    /** Reshape to the frontend Service contract. */
    public function toClient(): array
    {
        return ['id' => $this->service_id, 'service' => $this->service, 'score' => (float) $this->score];
    }
}
