<?php

namespace App\Services;

use App\Models\Competency;
use App\Models\DevelopmentPlan;
use App\Models\PerformanceKpi;
use App\Models\Program;
use App\Models\ServiceRequest;
use App\Models\Task;
use Illuminate\Support\Collection;

/**
 * Read-only snapshot of live NEXUS department data — shared by the AI chat and
 * the AI generators so every answer is grounded in the real database.
 */
class NexusData
{
    /** @return array<string, mixed> */
    public static function context(): array
    {
        $today = now()->toDateString();

        return [
            'open' => Task::whereNot('status', 'Done')->count(),
            'overdue' => Task::whereNot('status', 'Done')->whereDate('due_date', '<', $today)->count(),
            'review' => Task::where('status', 'Review')->count(),
            'atRisk' => Program::whereIn('status', ['At Risk', 'Delayed'])->count(),
            'onTrack' => Program::whereIn('status', ['On Track', 'Completed'])->count(),
            'openRequests' => ServiceRequest::whereNot('status', 'Resolved')->count(),
            'breached' => ServiceRequest::where('sla', 'Breached')->count(),
            'overallKpi' => self::overallKpi(),
            'competencyGaps' => Competency::whereColumn('current_level', '<', 'required_level')->count(),
            'programList' => Program::orderBy('id')->pluck('name')->take(5)->implode(', '),
        ];
    }

    public static function overallKpi(): int
    {
        $sum = PerformanceKpi::all()->sum(function ($k) {
            $ratio = $k->target > 0 ? min(1.1, $k->actual / $k->target) : 0;

            return $ratio * $k->weight;
        });

        return (int) round($sum);
    }

    public static function kpis(): Collection
    {
        return PerformanceKpi::orderByDesc('weight')->get();
    }

    /** Competencies where the current level is below the required level. */
    public static function competencyGaps(): Collection
    {
        return Competency::whereColumn('current_level', '<', 'required_level')
            ->orderByRaw('(required_level - current_level) desc')
            ->get();
    }

    public static function developmentPlans(): Collection
    {
        return DevelopmentPlan::orderBy('readiness')->get();
    }

    public static function programs(): Collection
    {
        return Program::orderBy('id')->get();
    }
}
