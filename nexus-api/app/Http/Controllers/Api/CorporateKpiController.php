<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CorporateKpi;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Corporate KPI catalogue (Performance Dictionary) — the top of the KPI cascade.
 *
 * Global (not unit-scoped): every authenticated viewer sees the same catalogue,
 * so Planning/Appraisal at any level can cascade from a single source of truth.
 * Writes are gated on performance.manage. Upsert is keyed by the client id
 * (kpi_id) so the frontend keeps a stable id and later edits/deletes hit the
 * right row — no temp-id reconciliation needed.
 */
class CorporateKpiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CorporateKpi::query();
        if ($p = $request->query('perspective')) {
            $query->where('perspective', $p);
        }
        if ($g = $request->query('goal')) {
            $query->where('strategic_goal_id', $g);
        }
        $rows = $query->orderBy('code')->get()->map(fn (CorporateKpi $k) => $k->toClient());

        return response()->json(['data' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kpi_id' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'perspective' => ['nullable', 'string', 'max:64'],
            'unit' => ['nullable', 'string', 'max:32'],
            'target' => ['nullable', 'string', 'max:64'],
            'strategic_goal_id' => ['nullable', 'string', 'max:255'],
            'cascadable_to' => ['nullable', 'array'],
            'cascadable_to.*' => ['string', 'max:255'],
        ]);

        $user = $request->user();
        $existing = CorporateKpi::where('kpi_id', $data['kpi_id'])->first();
        $kpi = CorporateKpi::updateOrCreate(
            ['kpi_id' => $data['kpi_id']],
            [
                'code' => $data['code'] ?? null,
                'name' => $data['name'],
                'perspective' => $data['perspective'] ?? null,
                'unit' => $data['unit'] ?? null,
                'target' => $data['target'] ?? null,
                'strategic_goal_id' => $data['strategic_goal_id'] ?? null,
                'cascadable_to' => $data['cascadable_to'] ?? [],
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        Audit::record('corporate_kpi.upsert', ['user' => $user, 'target' => $kpi->kpi_id, 'meta' => ['code' => $kpi->code]]);

        return response()->json(['data' => $kpi->toClient()]);
    }

    public function destroy(Request $request, string $kpiId): JsonResponse
    {
        $kpi = CorporateKpi::where('kpi_id', $kpiId)->first();
        if (! $kpi) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $kpi->delete();
        Audit::record('corporate_kpi.delete', ['user' => $request->user(), 'target' => $kpiId]);

        return response()->json(['data' => ['deleted' => $kpiId]]);
    }
}
