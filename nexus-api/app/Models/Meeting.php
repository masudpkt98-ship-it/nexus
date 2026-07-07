<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    protected $fillable = ['title', 'scheduled_label', 'scheduled_at', 'attendees', 'action_items'];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'attendees' => 'integer',
        'action_items' => 'integer',
    ];
}
