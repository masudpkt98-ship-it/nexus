<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationItem extends Model
{
    protected $table = 'notifications_center';

    protected $fillable = ['user_id', 'channel', 'kind', 'title', 'time_label', 'read'];

    protected $casts = ['read' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
