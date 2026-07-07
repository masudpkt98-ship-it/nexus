<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevelopmentPlan extends Model
{
    protected $fillable = ['user_id', 'employee', 'avatar', 'role', 'readiness', 'gaps', 'next_step'];

    protected $casts = [
        'readiness' => 'integer',
        'gaps' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
