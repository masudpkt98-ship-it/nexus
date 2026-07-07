<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MetricPoint;
use App\Models\NpsResponse;
use App\Models\SatisfactionService;
use Illuminate\Http\JsonResponse;

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
            'byService' => SatisfactionService::orderBy('position')->get()
                ->map(fn ($s) => ['service' => $s->service, 'score' => (float) $s->score]),
            'trend' => MetricPoint::where('series', 'satisfaction')->orderBy('position')->get()
                ->map(fn ($p) => ['m' => $p->label, 'v' => (float) $p->value]),
        ]);
    }
}
