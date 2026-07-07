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

    /** Create a department-wide notification. Never throws (best-effort). */
    public static function raise(string $title, string $channel = 'In-App', string $kind = 'system'): void
    {
        try {
            static::create([
                'channel' => $channel,
                'kind' => $kind,
                'title' => $title,
                'time_label' => 'just now',
                'read' => false,
            ]);
        } catch (\Throwable $e) {
            // A notification failure must never break the primary action.
        }
    }
}
