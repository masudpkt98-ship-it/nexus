<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetencyCurrentLevel extends Model
{
    protected $fillable = ['npk', 'comp_code', 'level', 'updated_by'];

    protected $casts = ['level' => 'integer'];
}
