<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Central audit recorder. Never throws into the caller — a logging failure must
 * not break the audited action.
 */
class Audit
{
    public static function record(string $action, array $attrs = []): void
    {
        try {
            /** @var User|null $user */
            $user = $attrs['user'] ?? Auth::user();
            AuditLog::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? ($attrs['user_name'] ?? null),
                'action' => $action,
                'target' => $attrs['target'] ?? null,
                'unit_key' => $attrs['unit_key'] ?? null,
                'directorate' => $attrs['directorate'] ?? null,
                'ip' => request()?->ip(),
                'meta' => $attrs['meta'] ?? null,
                'created_at' => now(),
            ]);
        } catch (\Throwable) {
            // swallow — auditing is best-effort, the action itself already ran
        }
    }
}
