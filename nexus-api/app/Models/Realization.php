<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Realization extends Model
{
    use Auditable;

    protected $fillable = [
        'kpi_id', 'slot', 'year', 'unit_key', 'unit_name', 'directorate',
        'value', 'evidence_type', 'evidence', 'evidence_name', 'note',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'value' => 'float',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
