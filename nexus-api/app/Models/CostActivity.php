<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CostActivity extends Model
{
    protected $fillable = [
        'activity_id', 'ref_no', 'nama', 'jenis', 'tujuan', 'latar_belakang', 'output',
        'tanggal', 'lokasi', 'penanggung_jawab', 'peserta', 'budget', 'travel',
        'attachments', 'realizations', 'evidence', 'lpj', 'status', 'created_at_label',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'tanggal' => 'date:Y-m-d',
        'budget' => 'array',
        'travel' => 'array',
        'attachments' => 'array',
        'realizations' => 'array',
        'evidence' => 'array',
        'lpj' => 'array',
    ];

    /** Reshape to the frontend Activity contract (camelCase, client id). */
    public function toClient(): array
    {
        return [
            'id' => $this->activity_id,
            'refNo' => $this->ref_no,
            'nama' => $this->nama,
            'jenis' => $this->jenis,
            'tujuan' => $this->tujuan ?? '',
            'latarBelakang' => $this->latar_belakang ?? '',
            'output' => $this->output ?? '',
            'tanggal' => optional($this->tanggal)->format('Y-m-d') ?? '',
            'lokasi' => $this->lokasi ?? '',
            'penanggungJawab' => $this->penanggung_jawab ?? '',
            'peserta' => $this->peserta ?? '',
            'budget' => $this->budget ?? [],
            'travel' => $this->travel,
            'attachments' => $this->attachments ?? [],
            'realizations' => $this->realizations ?? [],
            'evidence' => $this->evidence ?? [],
            // The LPJ is a fixed set of narrative fields; an object keeps it that
            // way even when empty (a bare [] would decode as a list client-side).
            'lpj' => (object) ($this->lpj ?? []),
            'status' => $this->status,
            'createdAt' => $this->created_at_label ?? optional($this->created_at)->toIso8601String(),
        ];
    }
}
