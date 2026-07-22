<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ScopesByUnit;
use App\Http\Controllers\Controller;
use App\Models\Appraisal;
use App\Support\Audit;
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
    use ScopesByUnit;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Appraisal::query();
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
            'unit_key' => ['required', 'string', 'max:255'],
            'unit_name' => ['nullable', 'string', 'max:255'],
            'directorate' => ['nullable', 'string', 'max:255'],
            'compartment' => ['nullable', 'string', 'max:255'],
            'year' => ['required', 'string', 'max:16'],
            'status' => ['required', 'in:Drafted,Approved'],
            'version' => ['nullable', 'integer', 'min:1'],
            'pbi' => ['nullable', 'array'],
        ]);

        if (! $this->canWriteUnit($user, (string) ($data['directorate'] ?? ''), (string) ($data['unit_name'] ?? ''), (string) ($data['compartment'] ?? ''))) {
            Audit::record('scope.denied', ['user' => $user, 'target' => $data['unit_key'] ?? null, 'directorate' => $data['directorate'] ?? null, 'meta' => ['action' => 'appraisal.upsert', 'compartment' => $data['compartment'] ?? null]]);

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
                'compartment' => $data['compartment'] ?? ($existing->compartment ?? null),
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
