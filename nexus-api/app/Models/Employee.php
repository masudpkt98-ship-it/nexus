<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'npk', 'name', 'unit_name', 'directorate', 'payload', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
