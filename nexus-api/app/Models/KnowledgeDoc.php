<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeDoc extends Model
{
    protected $fillable = ['title', 'category', 'version', 'type', 'approval', 'owner', 'updated_on'];

    protected $casts = [
        'updated_on' => 'date:Y-m-d',
    ];
}
