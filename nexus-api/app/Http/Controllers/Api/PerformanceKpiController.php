<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PerformanceKpiResource;
use App\Models\NotificationItem;
use App\Models\PerformanceKpi;
use App\Models\TopPerformer;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceKpiController extends Controller
{
    public function index()
    {
        return PerformanceKpiResource::collection(
            PerformanceKpi::orderByDesc('weight')->get()
        );
    }

    /**
     * The hub's top-performer ranking.
     *
     * Kept here rather than in AppraisalController: the page stores these under a
     * localStorage key called "appraisals", but they share nothing with the KPI
     * cascade's appraisal rows beyond that name.
     */
    public function performers(): JsonResponse
    {
        return response()->json(['data' => TopPerformer::orderByDesc('score')->get()->map(fn (TopPerformer $p) => $p->toClient())]);
    }

    public function performerUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'avatar' => ['nullable', 'string', 'max:4'],
            'role' => ['nullable', 'string', 'max:255'],
            'score' => ['required', 'integer', 'between:0,100'],
        ]);

        $performer = TopPerformer::updateOrCreate(
            ['perf_id' => $data['id']],
            [
                'name' => $data['name'],
                'avatar' => $data['avatar'] ?? null,
                'role' => $data['role'] ?? null,
                'score' => $data['score'],
                'updated_by' => $request->user()?->id,
            ]
        );

        Audit::record('top_performer.upsert', ['user' => $request->user(), 'target' => $performer->perf_id]);

        return response()->json(['data' => $performer->toClient()]);
    }

    public function performerDestroy(Request $request, string $perfId): JsonResponse
    {
        $performer = TopPerformer::where('perf_id', $perfId)->first();
        if (! $performer) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $performer->delete();
        Audit::record('top_performer.delete', ['user' => $request->user(), 'target' => $perfId]);

        return response()->json(['data' => ['deleted' => $perfId]]);
    }

    public function store(Request $request): JsonResponse
    {
        // Create first, then derive a stable, unique code from the new id.
        $kpi = PerformanceKpi::create($this->attributes($request) + ['code' => 'TEMP-'.uniqid()]);
        $kpi->update(['code' => 'KPI-'.str_pad((string) $kpi->id, 3, '0', STR_PAD_LEFT)]);
        NotificationItem::raise("New KPI defined: {$kpi->name}", 'In-App', 'performance');

        return response()->json(['data' => new PerformanceKpiResource($kpi)], 201);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $kpi = PerformanceKpi::where('code', $code)->firstOrFail();
        $kpi->update($this->attributes($request));

        return response()->json(['data' => new PerformanceKpiResource($kpi)]);
    }

    public function destroy(string $code): JsonResponse
    {
        $kpi = PerformanceKpi::where('code', $code)->firstOrFail();
        $kpi->delete();

        return response()->json(['data' => ['id' => $code]]);
    }

    private function attributes(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'level' => ['required', 'in:Corporate,Department,Individual'],
            'weight' => ['required', 'integer', 'between:0,100'],
            'target' => ['required', 'numeric', 'min:0'],
            'actual' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:20'],
        ]);
        $data['unit'] = $data['unit'] ?? '';

        return $data;
    }
}
