<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appraisal;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Performance Appraisal — server-enforced approval status + PBI scores.
 *
 * This is the template for moving performance data off the browser: every read
 * and write is (1) authenticated (auth:sanctum), (2) permission-gated
 * (performance.view / performance.manage), and (3) ROW-LEVEL SCOPED to the
 * user's unit / directorate. A KPI Partner physically cannot read or approve
 * another unit's appraisal — the server rejects it regardless of the client.
 */
class AppraisalController extends Controller
{
    /** Admin (wildcard) sees everything. */
    private function isAdmin(User $user): bool
    {
        return in_array('*', $user->permissions(), true);
    }

    /** Apply the caller's data scope to a query. */
    private function scope(Builder $query, User $user): Builder
    {
        if ($this->isAdmin($user)) {
            return $query;
        }
        $unit = trim((string) $user->unit);
        $dir = trim((string) $user->directorate);

        // KPI Partner → only their own unit kerja.
        if ($user->role === 'KPI Partner' && $unit !== '') {
            return $query->where('unit_name', $unit);
        }
        // KPI Partner Manajemen / directorate-scoped roles → whole directorate.
        if ($dir !== '') {
            return $query->where('directorate', $dir);
        }
        if ($unit !== '') {
            return $query->where('unit_name', $unit);
        }
        // No scope fields → only rows they created (safe default, never "all").
        return $query->where('created_by', $user->id);
    }

    /** Whether the caller may write the appraisal for a given unit. */
    private function canWrite(User $user, string $directorate, string $unitName): bool
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

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Appraisal::query();
        if ($year = $request->query('year')) {
            $query->where('year', $year);
        }
        $rows = $this->scope($query, $user)->get();

        return response()->json(['data' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'unit_key' => ['required', 'string', 'max:255'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'directorate' => ['nullable', 'string', 'max:255'],
            'year' => ['required', 'string', 'max:16'],
            'status' => ['required', 'in:Drafted,Approved'],
            'version' => ['nullable', 'integer', 'min:1'],
            'pbi' => ['nullable', 'array'],
        ]);

        if (! $this->canWrite($user, (string) ($data['directorate'] ?? ''), (string) ($data['unit_name'] ?? ''))) {
            return response()->json([
                'message' => 'You are not allowed to modify the appraisal for this unit.',
            ], 403);
        }

        $existing = Appraisal::where('unit_key', $data['unit_key'])->where('year', $data['year'])->first();

        $appraisal = Appraisal::updateOrCreate(
            ['unit_key' => $data['unit_key'], 'year' => $data['year']],
            [
                'unit_name' => $data['unit_name'] ?? ($existing->unit_name ?? null),
                'directorate' => $data['directorate'] ?? ($existing->directorate ?? null),
                'status' => $data['status'],
                'version' => $data['version'] ?? ($existing->version ?? 1),
                'pbi' => $data['pbi'] ?? ($existing->pbi ?? []),
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        return response()->json(['data' => $appraisal]);
    }
}
