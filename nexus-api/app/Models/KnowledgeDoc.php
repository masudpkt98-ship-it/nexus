<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeDoc extends Model
{
    protected $fillable = ['doc_id', 'title', 'category', 'version', 'type', 'approval', 'owner', 'updated_on'];

    protected $casts = [
        'updated_on' => 'date:Y-m-d',
    ];

    /** Guarantee a client id however the row was created (seeder included). */
    protected static function booted(): void
    {
        static::creating(function (self $doc) {
            if (blank($doc->doc_id)) {
                $doc->doc_id = 'kd-'.str()->random(8);
            }
        });
    }
}
