<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevelopmentPlan extends Model
{
    protected $fillable = ['plan_id', 'user_id', 'employee', 'avatar', 'role', 'readiness', 'gaps', 'next_step'];

    protected $casts = [
        'readiness' => 'integer',
        'gaps' => 'integer',
    ];

    /**
     * Guarantee every plan has a client id, whoever created it.
     *
     * The hub keys edits on `plan_id`; a row created outside the API (the seeder,
     * a console command) would otherwise come back without one and the frontend
     * would fall back to a positional id that shifts between loads.
     */
    protected static function booted(): void
    {
        static::creating(function (self $plan) {
            if (blank($plan->plan_id)) {
                $plan->plan_id = 'dp-'.str()->random(8);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
