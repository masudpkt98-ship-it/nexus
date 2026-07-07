<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NpsResponse extends Model
{
    protected $fillable = ['score'];

    protected $casts = ['score' => 'integer'];
}
