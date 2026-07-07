<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\MeetingResource;
use App\Http\Resources\ProgramResource;
use App\Models\Activity;
use App\Models\DevelopmentPlan;
use App\Models\Meeting;
use App\Models\PerformanceKpi;
use App\Models\Program;
use App\Models\ServiceRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // ---- Live widget counts (derived from the database) ----
        $today = now()->toDateString();

        $openTasks = Task::whereNot('status', 'Done')->count();
        $overdue = Task::whereNot('status', 'Done')->whereDate('due_date', '<', $today)->count();
        $approvals = Task::where('status', 'Review')->count();
        $requests = ServiceRequest::whereNot('status', 'Resolved')->count();

        $totalTasks = Task::count();
        $doneTasks = Task::where('status', 'Done')->count();
        $taskCompletion = $totalTasks > 0 ? round($doneTasks / $totalTasks * 100) : 0;

        // ---- Program health (traffic light) ----
        $health = [
            'onTrack' => Program::whereIn('status', ['On Track', 'Completed'])->count(),
            'atRisk' => Program::where('status', 'At Risk')->count(),
            'delayed' => Program::where('status', 'Delayed')->count(),
        ];

        // ---- Weighted overall KPI achievement ----
        $kpis = PerformanceKpi::all();
        $overallKpi = $kpis->sum(function ($k) {
            $ratio = $k->target > 0 ? min(1.1, $k->actual / $k->target) : 0;

            return $ratio * $k->weight;
        });
        $overallKpi = round($overallKpi);

        $competencyIndex = (int) round(
            (DevelopmentPlan::avg('readiness')) ?: 0
        );

        // ---- Executive KPI hero cards ----
        $executiveKpis = [
            ['label' => 'Overall KPI Achievement', 'value' => $overallKpi, 'target' => 90, 'unit' => '%', 'delta' => 3.2, 'status' => $this->light($overallKpi, 90)],
            ['label' => 'Task Completion Rate', 'value' => $taskCompletion, 'target' => 95, 'unit' => '%', 'delta' => 1.8, 'status' => $this->light($taskCompletion, 95)],
            ['label' => 'Customer Satisfaction', 'value' => 4.4, 'target' => 4.5, 'unit' => '/5', 'delta' => 0.2, 'status' => 'green'],
            ['label' => 'Competency Index', 'value' => $competencyIndex, 'target' => 85, 'unit' => '%', 'delta' => -1.1, 'status' => $this->light($competencyIndex, 85)],
        ];

        $topPerformers = DevelopmentPlan::orderByDesc('readiness')->take(4)->get()->map(fn ($d) => [
            'name' => $d->employee,
            'avatar' => $d->avatar,
            'score' => $d->readiness,
            'role' => $d->role,
        ]);

        return response()->json([
            'widgets' => [
                ['label' => 'Open Tasks', 'value' => $openTasks, 'icon' => 'task', 'tone' => 'blue'],
                ['label' => 'Overdue', 'value' => $overdue, 'icon' => 'alert', 'tone' => 'red'],
                ['label' => 'Approvals Pending', 'value' => $approvals, 'icon' => 'check', 'tone' => 'gold'],
                ['label' => 'Customer Requests', 'value' => $requests, 'icon' => 'request', 'tone' => 'blue'],
            ],
            'executiveKpis' => $executiveKpis,
            'health' => $health,
            'overallKpi' => $overallKpi,
            'kpiTrend' => $this->kpiTrend(),
            'satisfactionTrend' => $this->satisfactionTrend(),
            'workloadByTeam' => $this->workloadByTeam(),
            'competencyHeatmap' => $this->competencyHeatmap(),
            'topPerformers' => $topPerformers,
            'recentActivity' => ActivityResource::collection(Activity::orderByDesc('id')->take(7)->get()),
            'meetings' => MeetingResource::collection(Meeting::orderBy('scheduled_at')->take(3)->get()),
            'programs' => ProgramResource::collection(Program::with('owner')->orderBy('id')->take(5)->get()),
        ]);
    }

    private function light(float $value, float $target): string
    {
        if ($value >= $target) {
            return 'green';
        }

        return $value >= $target * 0.9 ? 'amber' : 'red';
    }

    private function kpiTrend(): array
    {
        return collect([
            ['m' => 'Jan', 'v' => 72], ['m' => 'Feb', 'v' => 74], ['m' => 'Mar', 'v' => 78],
            ['m' => 'Apr', 'v' => 77], ['m' => 'May', 'v' => 82], ['m' => 'Jun', 'v' => 85],
            ['m' => 'Jul', 'v' => 87],
        ])->all();
    }

    private function satisfactionTrend(): array
    {
        return collect([
            ['m' => 'Jan', 'v' => 4.0], ['m' => 'Feb', 'v' => 4.1], ['m' => 'Mar', 'v' => 4.1],
            ['m' => 'Apr', 'v' => 4.2], ['m' => 'May', 'v' => 4.3], ['m' => 'Jun', 'v' => 4.3],
            ['m' => 'Jul', 'v' => 4.4],
        ])->all();
    }

    private function workloadByTeam(): array
    {
        return [
            ['team' => 'Performance', 'open' => 24, 'done' => 61],
            ['team' => 'Development', 'open' => 18, 'done' => 42],
            ['team' => 'Competency', 'open' => 31, 'done' => 38],
            ['team' => 'Customer', 'open' => 12, 'done' => 55],
            ['team' => 'Strategy', 'open' => 9, 'done' => 27],
        ];
    }

    private function competencyHeatmap(): array
    {
        return [
            'competencies' => ['Leadership', 'Analytics', 'Communication', 'Project Mgmt', 'Technical', 'Coaching'],
            'teams' => ['Perf.', 'Dev.', 'Comp.', 'Cust.', 'Strat.'],
            'matrix' => [
                [82, 74, 70, 66, 88], [90, 68, 85, 60, 79], [76, 80, 72, 88, 70],
                [70, 66, 64, 58, 84], [88, 62, 90, 55, 66], [64, 78, 60, 72, 74],
            ],
        ];
    }
}
