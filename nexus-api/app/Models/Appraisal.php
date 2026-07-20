<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appraisal extends Model
{
    protected $fillable = [
        'unit_key', 'unit_name', 'directorate', 'year',
        'status', 'version', 'pbi', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'pbi' => 'array',
        'version' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
