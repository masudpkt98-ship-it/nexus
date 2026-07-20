<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Shared row-level authorization for performance data (Planning / Monitoring /
 * Appraisal). Reads are scoped to the caller's unit/directorate; writes are
 * restricted to a unit inside that scope. Admin (wildcard permission) is global.
 */
trait ScopesByUnit
{
    protected function isAdmin(User $user): bool
    {
        return in_array('*', $user->permissions(), true);
    }

    /** Restrict a query to the rows the user is allowed to see. */
    protected function scopeToUser(Builder $query, User $user): Builder
    {
        if ($this->isAdmin($user)) {
            return $query;
        }
        $unit = trim((string) $user->unit);
        $dir = trim((string) $user->directorate);

        if ($user->role === 'KPI Partner' && $unit !== '') {
            return $query->where('unit_name', $unit);
        }
        if ($dir !== '') {
            return $query->where('directorate', $dir);
        }
        if ($unit !== '') {
            return $query->where('unit_name', $unit);
        }

        return $query->where('created_by', $user->id);
    }

    /** Whether the user may write a row belonging to the given unit. */
    protected function canWriteUnit(User $user, string $directorate, string $unitName): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }
        $unit = trim((string) $user->unit);
        $dir = trim((string) $user->directorate);

        if ($user->role === 'KPI Partner') {
            return $unit !== '' && $unitName === $unit;
        }
        if ($dir !== '') {
            return $directorate === $dir;
        }
        if ($unit !== '') {
            return $unitName === $unit;
        }

        return false;
    }
}
