<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiTeknis extends Model
{
    protected $table = 'kpi_teknis';

    protected $fillable = [
        'kpi_id', 'job_profile_id', 'kpi', 'validitas', 'satuan', 'polaritas',
        'tipe', 'prioritas', 'bobot', 'pengukuran', 'frekuensi', 'target',
        'created_by', 'updated_by',
    ];

    /** Reshape to the frontend KpiTeknis contract (client id + camelCase link). */
    public function toClient(): array
    {
        return [
            'id' => $this->kpi_id,
            'jobProfileId' => $this->job_profile_id,
            'kpi' => $this->kpi,
            'validitas' => $this->validitas,
            'satuan' => $this->satuan,
            'polaritas' => $this->polaritas,
            'tipe' => $this->tipe,
            'prioritas' => $this->prioritas,
            'bobot' => $this->bobot,
            'pengukuran' => $this->pengukuran,
            'frekuensi' => $this->frekuensi,
            'target' => $this->target,
        ];
    }
}
