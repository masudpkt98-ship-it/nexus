<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobDescription extends Model
{
    protected $fillable = [
        'desc_key', 'jabatan_name', 'kode_jabatan', 'direktorat', 'kompartemen', 'departemen',
        'purpose', 'responsibilities', 'dimensi', 'authority', 'relations',
        'qualifications', 'certifications', 'risks', 'updated_by',
    ];

    protected $casts = ['responsibilities' => 'array'];

    /** Reshape to the frontend JobDesc contract (camelCase; no key — it is the map key). */
    public function toClient(): array
    {
        return [
            'jabatanName' => $this->jabatan_name,
            'kodeJabatan' => $this->kode_jabatan,
            'direktorat' => $this->direktorat,
            'kompartemen' => $this->kompartemen,
            'departemen' => $this->departemen,
            'purpose' => $this->purpose ?? '',
            'responsibilities' => $this->responsibilities ?? [],
            'dimensi' => $this->dimensi,
            'authority' => $this->authority,
            'relations' => $this->relations,
            'qualifications' => $this->qualifications ?? '',
            'certifications' => $this->certifications ?? '',
            'risks' => $this->risks ?? '',
        ];
    }
}
