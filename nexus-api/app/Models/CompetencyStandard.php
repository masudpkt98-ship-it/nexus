<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompetencyStandard extends Model
{
    protected $fillable = ['group_key', 'comp_id', 'required_level', 'updated_by'];

    protected $casts = ['required_level' => 'integer'];
}
