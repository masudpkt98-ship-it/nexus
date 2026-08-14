<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DictionaryCompetency extends Model
{
    protected $table = 'competency_dictionary';

    protected $fillable = [
        'comp_id', 'code', 'name', 'category', 'definition', 'indicators',
        'key_actions', 'job_family', 'job_family_name', 'function_name', 'updated_by',
    ];

    protected $casts = [
        'indicators' => 'array',
        'key_actions' => 'array',
    ];

    /** Reshape to the frontend DictionaryCompetency contract (camelCase, client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->comp_id,
            'code' => $this->code,
            'name' => $this->name,
            'category' => $this->category,
            'definition' => $this->definition ?? '',
            'indicators' => $this->indicators ?? [],
            'keyActions' => $this->key_actions ?? [],
            'jobFamily' => $this->job_family,
            'jobFamilyName' => $this->job_family_name,
            'functionName' => $this->function_name,
        ];
    }
}
