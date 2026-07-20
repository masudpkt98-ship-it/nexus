<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesByUnit;
use App\Http\Controllers\Controller;
use App\Models\PlanningKpi;
use App\Models\PlanningOwner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Performance Planning — server-enforced, unit-scoped KPIs + KPI Owners.
 *
 * Same template as Monitoring/Appraisal: authenticated + permission-gated + ROW-
 * LEVEL SCOPED. Write is gated on performance.view (planning is unit data entry —
 * a unit plans its own KPIs) with canWriteUnit() restricting every write/delete
 * to a unit inside the caller's scope.
 */
class PlanningController extends Controller
{
    use ScopesByUnit;

    // ---- KPIs ---------------------------------------------------------------
    public function kpisIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = PlanningKpi::query();
        if ($year = $request->query('year')) {
            $query->where('period', $year);
        }
        $rows = $this->scopeToUser($query, $user)->get();

        return response()->json(['data' => $rows]);
    }

    public function kpiUpsert(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'kpi_id' => ['required', 'string', 'max:255'],
            'unit_key' => ['required', 'string', 'max:255'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'directorate' => ['nullable', 'string', 'max:255'],
            'period' => ['required', 'string', 'max:16'],
            'payload' => ['required', 'array'],
        ]);

        if (! $this->canWriteUnit($user, (string) ($data['directorate'] ?? ''), (string) ($data['unit_name'] ?? ''))) {
            return response()->json(['message' => 'You are not allowed to plan KPIs for this unit.'], 403);
        }

        $existing = PlanningKpi::where('kpi_id', $data['kpi_id'])->first();
        $kpi = PlanningKpi::updateOrCreate(
            ['kpi_id' => $data['kpi_id']],
            [
                'unit_key' => $data['unit_key'],
                'unit_name' => $data['unit_name'] ?? null,
                'directorate' => $data['directorate'] ?? null,
                'period' => $data['period'],
                'payload' => $data['payload'],
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        return response()->json(['data' => $kpi]);
    }

    public function kpiDestroy(Request $request, string $kpiId): JsonResponse
    {
        $user = $request->user();
        $kpi = PlanningKpi::where('kpi_id', $kpiId)->first();
        if (! $kpi) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        if (! $this->canWriteUnit($user, (string) $kpi->directorate, (string) $kpi->unit_name)) {
            return response()->json(['message' => 'You are not allowed to delete this KPI.'], 403);
        }
        $kpi->delete();

        return response()->json(['data' => ['deleted' => $kpiId]]);
    }

    // ---- KPI Owners ---------------------------------------------------------
    public function ownersIndex(Request $request): JsonResponse
    {
        $rows = $this->scopeToUser(PlanningOwner::query(), $request->user())->get();

        return response()->json(['data' => $rows]);
    }

    public function ownerUpsert(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'unit_key' => ['required', 'string', 'max:255'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'directorate' => ['nullable', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'npk' => ['nullable', 'string', 'max:64'],
        ]);

        if (! $this->canWriteUnit($user, (string) ($data['directorate'] ?? ''), (string) ($data['unit_name'] ?? ''))) {
            return response()->json(['message' => 'You are not allowed to set the owner for this unit.'], 403);
        }

        $existing = PlanningOwner::where('unit_key', $data['unit_key'])->first();
        $owner = PlanningOwner::updateOrCreate(
            ['unit_key' => $data['unit_key']],
            [
                'unit_name' => $data['unit_name'] ?? null,
                'directorate' => $data['directorate'] ?? null,
                'jabatan' => $data['jabatan'] ?? null,
                'name' => $data['name'] ?? null,
                'npk' => $data['npk'] ?? null,
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        return response()->json(['data' => $owner]);
    }
}
