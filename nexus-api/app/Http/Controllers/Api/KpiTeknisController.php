<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KpiTeknis;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * KPI Teknis (Performance Dictionary) — technical KPIs defined per Job Profile,
 * part of the KPI cascade source. Global catalogue; performance.manage to write.
 * Upsert keyed by the client id (kt-…) so edits/deletes hit the right row.
 */
class KpiTeknisController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = KpiTeknis::query();
        if ($jp = $request->query('job_profile_id')) {
            $query->where('job_profile_id', $jp);
        }
        $rows = $query->orderBy('id')->get()->map(fn (KpiTeknis $k) => $k->toClient());

        return response()->json(['data' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kpi_id' => ['required', 'string', 'max:255'],
            'job_profile_id' => ['nullable', 'string', 'max:255'],
            'kpi' => ['required', 'string', 'max:255'],
            'validitas' => ['nullable', 'string', 'max:64'],
            'satuan' => ['nullable', 'string', 'max:64'],
            'polaritas' => ['nullable', 'string', 'max:64'],
            'tipe' => ['nullable', 'string', 'max:64'],
            'prioritas' => ['nullable', 'string', 'max:64'],
            'bobot' => ['nullable', 'string', 'max:64'],
            'pengukuran' => ['nullable', 'string', 'max:64'],
            'frekuensi' => ['nullable', 'string', 'max:64'],
            'target' => ['nullable', 'string', 'max:64'],
        ]);

        $user = $request->user();
        $existing = KpiTeknis::where('kpi_id', $data['kpi_id'])->first();
        $row = KpiTeknis::updateOrCreate(
            ['kpi_id' => $data['kpi_id']],
            array_merge(
                collect($data)->except('kpi_id')->toArray(),
                ['created_by' => $existing->created_by ?? $user->id, 'updated_by' => $user->id],
            )
        );

        Audit::record('kpi_teknis.upsert', ['user' => $user, 'target' => $row->kpi_id]);

        return response()->json(['data' => $row->toClient()]);
    }

    public function destroy(Request $request, string $kpiId): JsonResponse
    {
        $row = KpiTeknis::where('kpi_id', $kpiId)->first();
        if (! $row) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $row->delete();
        Audit::record('kpi_teknis.delete', ['user' => $request->user(), 'target' => $kpiId]);

        return response()->json(['data' => ['deleted' => $kpiId]]);
    }
}
