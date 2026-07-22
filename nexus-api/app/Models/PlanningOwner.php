<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;

class PlanningOwner extends Model
{
    use Auditable;

    protected $table = 'planning_owners';

    protected $fillable = [
        'unit_key', 'unit_name', 'directorate', 'compartment',
        'jabatan', 'name', 'npk', 'created_by', 'updated_by',
    ];
}
