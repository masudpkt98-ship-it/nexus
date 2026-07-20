<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanningOwner extends Model
{
    protected $table = 'planning_owners';

    protected $fillable = [
        'unit_key', 'unit_name', 'directorate',
        'jabatan', 'name', 'npk', 'created_by', 'updated_by',
    ];
}
