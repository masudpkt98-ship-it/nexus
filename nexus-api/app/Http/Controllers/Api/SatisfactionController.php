<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MetricPoint;
use App\Models\NpsResponse;
use App\Models\SatisfactionService;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer satisfaction — NPS and per-service scores.
 *
 * Writes share satisfaction.view: the page is ungated in the UI and the RBAC map
 * has no satisfaction.manage, the same call made for Documents and Meetings.
 */
class SatisfactionController extends Controller
{
    public function index(): JsonResponse
    {
        // NPS computed from raw survey responses (0-10 scale)
        $total = NpsResponse::count() ?: 1;
        $promoters = NpsResponse::where('score', '>=', 9)->count();
        $detractors = NpsResponse::where('score', '<=', 6)->count();
        $passives = $total - $promoters - $detractors;

        $pPct = (int) round($promoters / $total * 100);
        $dPct = (int) round($detractors / $total * 100);
        $nps = $pPct - $dPct;

        return response()->json([
            'nps' => [
                'promoters' => $pPct,
                'passives' => (int) round($passives / $total * 100),
                'detractors' => $dPct,
                'nps' => $nps,
                'responses' => $total,
            ],
            // Raw counts — the page keeps NPS as tallies and derives its own
            // percentages, so percentages alone would not round-trip.
            'counts' => [
                'promoters' => $promoters,
                'passives' => max(0, $passives),
                'detractors' => $detractors,
            ],
            'byService' => SatisfactionService::orderBy('position')->get()
                ->map(fn (SatisfactionService $s) => $s->toClient()),
            'trend' => MetricPoint::where('series', 'satisfaction')->orderBy('position')->get()
                ->map(fn ($p) => ['m' => $p->label, 'v' => (float) $p->value]),
        ]);
    }

    /**
     * Record one survey response.
     *
     * The form collects a 1–5 rating; it is stored as rating × 2 so the 0–10
     * scale in nps_responses buckets it exactly as the page does (5→10 promoter,
     * 4→8 passive, ≤3→≤6 detractor).
     */
    public function storeResponse(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'service_id' => ['nullable', 'string', 'max:255'],
        ]);

        NpsResponse::create([
            'score' => $data['rating'] * 2,
            'service_id' => $data['service_id'] ?? null,
        ]);

        Audit::record('satisfaction.response', ['user' => $request->user(), 'meta' => ['rating' => $data['rating']]]);

        return response()->json(['data' => ['ok' => true]]);
    }

    /** Create/update one service line, keyed by the client id. */
    public function upsertService(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_id' => ['required', 'string', 'max:255'],
            'service' => ['required', 'string', 'max:255'],
            'score' => ['required', 'numeric', 'between:0,5'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $service = SatisfactionService::updateOrCreate(
            ['service_id' => $data['service_id']],
            ['service' => $data['service'], 'score' => $data['score'], 'position' => $data['position'] ?? 0]
        );

        Audit::record('satisfaction_service.upsert', ['user' => $request->user(), 'target' => $service->service_id]);

        return response()->json(['data' => $service->toClient()]);
    }

    public function destroyService(Request $request, string $serviceId): JsonResponse
    {
        $service = SatisfactionService::where('service_id', $serviceId)->first();
        if (! $service) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $service->delete();
        Audit::record('satisfaction_service.delete', ['user' => $request->user(), 'target' => $serviceId]);

        return response()->json(['data' => ['deleted' => $serviceId]]);
    }
}
