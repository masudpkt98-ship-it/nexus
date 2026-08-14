<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    protected $fillable = ['meeting_id', 'title', 'scheduled_label', 'scheduled_at', 'attendees', 'action_items'];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'attendees' => 'integer',
        'action_items' => 'integer',
    ];

    /**
     * Guarantee a client id however the row was created.
     *
     * Rows made outside the API (the seeder) would otherwise come back with a null
     * id and the page could not address them for an edit or delete.
     */
    protected static function booted(): void
    {
        static::creating(function (self $meeting) {
            if (blank($meeting->meeting_id)) {
                $meeting->meeting_id = 'mtg-'.str()->random(8);
            }
        });
    }
}
