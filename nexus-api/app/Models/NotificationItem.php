<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationItem extends Model
{
    protected $table = 'notifications_center';

    protected $fillable = ['user_id', 'channel', 'kind', 'title', 'link', 'time_label', 'read'];

    protected $casts = ['read' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Create a department-wide notification. Never throws (best-effort). */
    public static function raise(string $title, string $channel = 'In-App', string $kind = 'system', ?string $link = null): void
    {
        try {
            static::create([
                'channel' => $channel,
                'kind' => $kind,
                'title' => $title,
                'link' => $link,
                'time_label' => 'just now',
                'read' => false,
            ]);
        } catch (\Throwable $e) {
            // A notification failure must never break the primary action.
        }
    }

    /**
     * Notify specific people — one row each, so a read by one is not a read by all.
     *
     * Used for anything addressed to a person rather than announced to the
     * department: "this needs your decision", "your proposal was approved".
     * Best-effort like raise(); the action it reports has already happened.
     *
     * @param  iterable<User>  $users
     */
    public static function notify(iterable $users, string $title, string $kind = 'approval', ?string $link = null, ?int $exceptUserId = null): void
    {
        foreach ($users as $user) {
            // Never tell someone about their own action.
            if ($exceptUserId !== null && $user->id === $exceptUserId) {
                continue;
            }
            try {
                static::create([
                    'user_id' => $user->id,
                    'channel' => 'In-App',
                    'kind' => $kind,
                    'title' => $title,
                    'link' => $link,
                    'time_label' => 'just now',
                    'read' => false,
                ]);
            } catch (\Throwable $e) {
                // keep going — one bad row must not stop the rest
            }
        }
    }
}
