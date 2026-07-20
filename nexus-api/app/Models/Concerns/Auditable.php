<?php

namespace App\Models\Concerns;

use App\Support\Audit;
use Illuminate\Support\Str;

/**
 * Auto-audit create/update/delete on a model. Target + unit context are pulled
 * from the model's own columns; a model may override auditMeta() for extra detail.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(fn ($m) => $m->writeAudit('created'));
        static::updated(fn ($m) => $m->writeAudit('updated'));
        static::deleted(fn ($m) => $m->writeAudit('deleted'));
    }

    public function writeAudit(string $event): void
    {
        Audit::record(Str::snake(class_basename(static::class)).'.'.$event, [
            'target' => $this->auditTarget(),
            'unit_key' => $this->unit_key ?? null,
            'directorate' => $this->directorate ?? null,
            'meta' => $this->auditMeta(),
        ]);
    }

    protected function auditTarget(): ?string
    {
        return (string) ($this->kpi_id ?? $this->unit_key ?? $this->npk ?? $this->getKey());
    }

    protected function auditMeta(): ?array
    {
        return null;
    }
}
