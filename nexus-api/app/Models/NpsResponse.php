<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NpsResponse extends Model
{
    protected $fillable = ['score', 'service_id'];

    protected $casts = ['score' => 'integer'];
}
