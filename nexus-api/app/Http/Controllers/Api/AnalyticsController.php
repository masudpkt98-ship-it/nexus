<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MetricPoint;
use App\Models\SatisfactionService;
use App\Models\Task;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $indexSeries = [
            'idx_productivity' => 'Productivity Score',
            'idx_competency' => 'Competency Index',
            'idx_training' => 'Training Index',
            'idx_sla' => 'SLA Compliance',
        ];

        $indices = collect($indexSeries)->map(function ($label, $series) {
            $pts = MetricPoint::where('series', $series)->orderBy('position')->pluck('value');
            $last = $pts->last() ?? 0;
            $prev = $pts->count() > 1 ? $pts[$pts->count() - 2] : $last;

            return [
                'label' => $label,
                'value' => (int) round($last),
                'delta' => (int) round($last - $prev),
                'trend' => $pts->map(fn ($v) => (int) round($v))->values(),
            ];
        })->values();

        // Task completion computed from live task data
        $total = Task::count() ?: 1;
        $done = Task::where('status', 'Done')->count();
        $overdue = Task::whereNot('status', 'Done')->whereDate('due_date', '<', now()->toDateString())->count();
        $active = max(0, $total - $done - $overdue);

        return response()->json([
            'indices' => $indices,
            'taskCompletion' => [
                'done' => $done,
                'active' => $active,
                'overdue' => $overdue,
                'completionPct' => (int) round($done / $total * 100),
            ],
            'kpiTrend' => MetricPoint::where('series', 'kpi')->orderBy('position')->get()
                ->map(fn ($p) => ['m' => $p->label, 'v' => (float) $p->value]),
            'satisfactionTrend' => MetricPoint::where('series', 'satisfaction')->orderBy('position')->get()
                ->map(fn ($p) => ['m' => $p->label, 'v' => (float) $p->value]),
            'satisfactionByService' => SatisfactionService::orderBy('position')->get()
                ->map(fn ($s) => ['service' => $s->service, 'score' => (float) $s->score]),
            'workloadByTeam' => [
                ['team' => 'Performance', 'open' => 24, 'done' => 61],
                ['team' => 'Development', 'open' => 18, 'done' => 42],
                ['team' => 'Competency', 'open' => 31, 'done' => 38],
                ['team' => 'Customer', 'open' => 12, 'done' => 55],
                ['team' => 'Strategy', 'open' => 9, 'done' => 27],
            ],
        ]);
    }
}
