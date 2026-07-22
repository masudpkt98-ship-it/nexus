<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesByUnit;
use App\Http\Controllers\Controller;
use App\Models\Realization;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Performance Monitoring — server-enforced, unit-scoped Realisasi KPI.
 *
 * Same template as AppraisalController: authenticated + permission-gated + ROW-
 * LEVEL SCOPED by unit/directorate. Writing is gated on performance.view (this
 * is data entry — a unit owner records their own achievement) but canWrite()
 * still restricts every write to a unit inside the caller's scope, so a KPI
 * Partner can only submit Realisasi for their own unit.
 */
class RealizationController extends Controller
{
    use ScopesByUnit;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Realization::query();
        if ($year = $request->query('year')) {
            $query->where('year', $year);
        }
        $rows = $this->scopeToUser($query, $user)->get();

        return response()->json(['data' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'kpi_id' => ['required', 'string', 'max:255'],
            'slot' => ['required', 'string', 'max:64'],
            'year' => ['required', 'string', 'max:16'],
            'unit_key' => ['nullable', 'string', 'max:255'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'directorate' => ['nullable', 'string', 'max:255'],
            'compartment' => ['nullable', 'string', 'max:255'],
            'value' => ['nullable', 'numeric'],
            'evidence_type' => ['nullable', 'in:upload,link'],
            'evidence' => ['nullable', 'string'],
            'evidence_name' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
        ]);

        if (! $this->canWriteUnit($user, (string) ($data['directorate'] ?? ''), (string) ($data['unit_name'] ?? ''), (string) ($data['compartment'] ?? ''))) {
            Audit::record('scope.denied', ['user' => $user, 'target' => $data['unit_key'] ?? null, 'directorate' => $data['directorate'] ?? null, 'meta' => ['action' => 'realization.upsert', 'compartment' => $data['compartment'] ?? null]]);

            return response()->json([
                'message' => 'You are not allowed to submit Realisasi for this unit.',
            ], 403);
        }

        $existing = Realization::where('kpi_id', $data['kpi_id'])->where('slot', $data['slot'])->first();

        $realization = Realization::updateOrCreate(
            ['kpi_id' => $data['kpi_id'], 'slot' => $data['slot']],
            [
                'year' => $data['year'],
                'unit_key' => $data['unit_key'] ?? ($existing->unit_key ?? null),
                'unit_name' => $data['unit_name'] ?? ($existing->unit_name ?? null),
                'directorate' => $data['directorate'] ?? ($existing->directorate ?? null),
                'compartment' => $data['compartment'] ?? ($existing->compartment ?? null),
                'value' => $data['value'] ?? null,
                'evidence_type' => $data['evidence_type'] ?? null,
                'evidence' => $data['evidence'] ?? null,
                'evidence_name' => $data['evidence_name'] ?? null,
                'note' => $data['note'] ?? null,
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        return response()->json(['data' => $realization]);
    }
}
