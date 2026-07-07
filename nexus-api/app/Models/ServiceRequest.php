<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceRequest extends Model
{
    use SoftDeletes;

    protected $fillable = ['code', 'title', 'requester', 'priority', 'sla', 'status', 'pic_id', 'pic'];

    public function picUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_id');
    }
}
