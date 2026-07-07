<?php

namespace App\Http\Controllers\Api;

use Anthropic\Client;
use Anthropic\Messages\RawContentBlockDeltaEvent;
use Anthropic\Messages\TextDelta;
use App\Http\Controllers\Controller;
use App\Models\DevelopmentPlan;
use App\Services\NexusData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

/**
 * AI generators — produce Markdown artifacts (SMART KPIs, an Individual
 * Development Plan, an Executive Report), grounded in live NEXUS data. Uses
 * Claude Opus 4.8 when ANTHROPIC_API_KEY is set; otherwise a deterministic,
 * data-driven fallback so the feature always works. Each generator has a
 * one-shot JSON endpoint and a token-by-token SSE streaming endpoint.
 */
class AiGeneratorController extends Controller
{
    public function kpi(Request $request): JsonResponse
    {
        [$title, $prompt, $fallback] = $this->plan('kpi', $request);

        return $this->respond($title, $prompt, $fallback);
    }

    public function idp(Request $request): JsonResponse
    {
        [$title, $prompt, $fallback] = $this->plan('idp', $request);

        return $this->respond($title, $prompt, $fallback);
    }

    public function report(Request $request): JsonResponse
    {
        [$title, $prompt, $fallback] = $this->plan('report', $request);

        return $this->respond($title, $prompt, $fallback);
    }

    /** Token-by-token SSE stream for any generator kind. */
    public function stream(Request $request, string $kind): StreamedResponse
    {
        [, $prompt, $fallback] = $this->plan($kind, $request);
        $ctx = NexusData::context();
        $key = config('services.anthropic.key');

        return response()->stream(function () use ($key, $ctx, $prompt, $fallback) {
            $emit = function (array $payload) {
                echo 'data: '.json_encode($payload)."\n\n";
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
            };

            // 1) Stream from Claude.
            if ($key) {
                try {
                    $client = new Client(apiKey: $key);
                    $stream = $client->messages->createStream(
                        model: config('services.anthropic.model', 'claude-opus-4-8'),
                        maxTokens: 1800,
                        system: $this->systemPrompt($ctx),
                        messages: [['role' => 'user', 'content' => $prompt]],
                    );

                    $full = '';
                    foreach ($stream as $event) {
                        if (connection_aborted()) {
                            return;
                        }
                        if ($event instanceof RawContentBlockDeltaEvent && $event->delta instanceof TextDelta) {
                            $full .= $event->delta->text;
                            $emit(['type' => 'delta', 'text' => $event->delta->text]);
                        }
                    }
                    if ($full !== '') {
                        $emit(['type' => 'done', 'source' => 'claude']);

                        return;
                    }
                } catch (Throwable $e) {
                    // Fall through to the deterministic stream.
                }
            }

            // 2) Fallback: stream the deterministic Markdown word-by-word.
            $md = $fallback();
            $chunks = preg_split('/(\s+)/', $md, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [$md];
            foreach ($chunks as $chunk) {
                if (connection_aborted()) {
                    return;
                }
                if ($chunk === '') {
                    continue;
                }
                $emit(['type' => 'delta', 'text' => $chunk]);
                usleep(12000); // ~12ms cadence
            }
            $emit(['type' => 'done', 'source' => 'rules']);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    // ---------------------------------------------------------------------
    // Prompt + fallback builders (shared by the JSON and streaming paths)
    // ---------------------------------------------------------------------

    /**
     * @return array{0: string, 1: string, 2: callable} [title, userPrompt, fallback]
     */
    private function plan(string $kind, Request $request): array
    {
        return match ($kind) {
            'kpi' => $this->planKpi($request),
            'idp' => $this->planIdp($request),
            'report' => $this->planReport($request),
            default => abort(404),
        };
    }

    private function planKpi(Request $request): array
    {
        $data = $request->validate([
            'level' => ['nullable', 'in:Corporate,Department,Individual'],
            'focus' => ['nullable', 'string', 'max:120'],
        ]);
        $ctx = NexusData::context();
        $level = $data['level'] ?? 'Department';
        $focus = $data['focus'] ?? 'department performance';

        $prompt = "Propose 6 SMART KPIs at the {$level} level focused on {$focus}. "
            .'Return a Markdown H1 title, a short intro, then a Markdown table with columns '
            .'KPI | Level | Weight | Target | Rationale, and end with a one-line next step.';

        return ['SMART KPI Set', $prompt, fn () => $this->kpiFallback($ctx, $level)];
    }

    private function planIdp(Request $request): array
    {
        $data = $request->validate(['employee' => ['nullable', 'string', 'max:120']]);

        $plan = null;
        if (! empty($data['employee'])) {
            $plan = DevelopmentPlan::where('employee', 'like', '%'.$data['employee'].'%')->first();
        }
        $plan ??= NexusData::developmentPlans()->first(); // lowest readiness

        $gaps = NexusData::competencyGaps()->take(4);
        $gapText = $gaps->map(fn ($g) => "{$g->name} (current L{$g->current_level} → required L{$g->required_level})")->implode('; ');
        $person = $plan
            ? "{$plan->employee}, {$plan->role}, career readiness {$plan->readiness}%, {$plan->gaps} open gap(s), next step: {$plan->next_step}"
            : 'a department staff member';

        $prompt = "Draft an Individual Development Plan for {$person}. "
            ."Department competency gaps to consider: {$gapText}. "
            .'Return Markdown: an H1 title, a profile line, a "Focus areas" bullet list, '
            .'a "Milestones" section (0–3 / 3–6 / 6–12 months), a "Recommended certifications" list, '
            .'and a closing next step.';

        return ['Individual Development Plan', $prompt, fn () => $this->idpFallback($plan, $gaps)];
    }

    private function planReport(Request $request): array
    {
        $data = $request->validate(['scope' => ['nullable', 'string', 'max:120']]);
        $ctx = NexusData::context();
        $scope = $data['scope'] ?? 'Department Performance';

        $prompt = "Write a concise executive report titled for scope: {$scope}. "
            .'Use Markdown with sections: Overview, Highlights, Risks, Recommendations. '
            .'Ground every statement in the data and keep it under ~250 words.';

        return ['Executive Report', $prompt, fn () => $this->reportFallback($ctx, $scope)];
    }

    /**
     * Try Claude first (Markdown out), else the deterministic fallback.
     */
    private function respond(string $title, string $userPrompt, callable $fallback): JsonResponse
    {
        $ctx = NexusData::context();
        $key = config('services.anthropic.key');

        if ($key) {
            try {
                $md = $this->claudeMarkdown($key, $ctx, $userPrompt);

                return response()->json(['title' => $title, 'markdown' => $md, 'source' => 'claude']);
            } catch (Throwable $e) {
                // Fall through to the deterministic generator.
            }
        }

        return response()->json(['title' => $title, 'markdown' => $fallback(), 'source' => 'rules']);
    }

    private function claudeMarkdown(string $key, array $ctx, string $userPrompt): string
    {
        $client = new Client(apiKey: $key);

        $response = $client->messages->create(
            model: config('services.anthropic.model', 'claude-opus-4-8'),
            maxTokens: 1800,
            system: $this->systemPrompt($ctx),
            messages: [['role' => 'user', 'content' => $userPrompt]],
        );

        $text = '';
        foreach ($response->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text;
            }
        }
        $text = trim($text);
        if ($text === '') {
            throw new \RuntimeException('Empty response');
        }

        return $text;
    }

    private function systemPrompt(array $ctx): string
    {
        return <<<SYS
        You are the NEXUS AI Assistant for the Competency & Performance Management department.
        Produce a clean, professional **Markdown** artifact. Ground every statement in the live data below.
        Use headings, tables and bullet lists where helpful. Be concise and specific with numbers.

        LIVE DATA:
        - Open tasks: {$ctx['open']} (overdue: {$ctx['overdue']}, in review: {$ctx['review']})
        - Programs: {$ctx['onTrack']} on track, {$ctx['atRisk']} at risk/delayed
        - Customer requests: {$ctx['openRequests']} open ({$ctx['breached']} SLA breached)
        - Weighted overall KPI: {$ctx['overallKpi']}% (target 90%)
        - Competency gaps: {$ctx['competencyGaps']}
        - Programs: {$ctx['programList']}
        SYS;
    }

    // ---------------------------------------------------------------------
    // Deterministic, data-grounded fallbacks
    // ---------------------------------------------------------------------

    private function kpiFallback(array $c, string $level): string
    {
        return <<<MD
        # Suggested SMART KPIs — {$level}

        Derived from the current snapshot: overall KPI **{$c['overallKpi']}%**, **{$c['competencyGaps']}** competency gap(s), **{$c['breached']}** SLA breach(es), **{$c['overdue']}** overdue of {$c['open']} open task(s).

        | KPI | Level | Weight | Target | Rationale |
        |-----|-------|-------:|-------:|-----------|
        | Competency Gap Closure | Department | 25% | ≥ 60% | {$c['competencyGaps']} gaps open — largest lever on the competency index |
        | SLA Compliance | Department | 20% | ≥ 95% | {$c['breached']} breached SLA(s) this period |
        | On-Time Task Delivery | Department | 20% | ≥ 95% | {$c['overdue']} overdue of {$c['open']} open tasks |
        | Program On-Track Rate | Department | 15% | ≥ 90% | {$c['atRisk']} program(s) at risk/delayed |
        | Internal CSAT | Corporate | 10% | ≥ 4.5 | sustain customer value |
        | Cost Efficiency | Corporate | 10% | ≤ 100% | maintain budget discipline |

        _Next step: assign an owner to each KPI and cascade to individual scorecards for the quarter._
        MD;
    }

    private function idpFallback(?DevelopmentPlan $plan, $gaps): string
    {
        $name = $plan->employee ?? 'Department Staff';
        $role = $plan->role ?? 'Staff';
        $readiness = $plan->readiness ?? 65;
        $gapCount = $plan->gaps ?? $gaps->count();
        $nextStep = $plan->next_step ?? 'Foundational competency assessment';

        $focus = $gaps->take(3)->map(function ($g) {
            return "- **{$g->name}** — current L{$g->current_level} → required L{$g->required_level}: enrol in a targeted {$g->category} track and pair with a mentor.";
        })->implode("\n");
        if ($focus === '') {
            $focus = '- No critical gaps — focus on stretch assignments and leadership exposure.';
        }

        $certs = $gaps->take(3)->map(fn ($g) => "- {$g->category} advanced certification")->implode("\n");
        if ($certs === '') {
            $certs = '- Advanced leadership certification';
        }

        return <<<MD
        # Individual Development Plan — {$name}

        **Role:** {$role}  ·  **Career readiness:** {$readiness}%  ·  **Open gaps:** {$gapCount}

        ## Focus areas
        {$focus}

        ## Milestones
        - **0–3 months:** {$nextStep}; complete a baseline competency assessment.
        - **3–6 months:** targeted training on the weakest competency; on-the-job application.
        - **6–12 months:** a stretch assignment plus one certification; readiness review.

        ## Recommended certifications
        {$certs}

        _Next step: review this plan with the line manager and set quarterly checkpoints._
        MD;
    }

    private function reportFallback(array $c, string $scope): string
    {
        $date = now()->toFormattedDateString();

        return <<<MD
        # Executive Report — {$scope}

        _Snapshot as of {$date}_

        ## Overview
        Weighted overall KPI achievement is **{$c['overallKpi']}%** against a 90% target. Of {$c['open']} open task(s), **{$c['overdue']}** are overdue and **{$c['review']}** await approval. **{$c['onTrack']}** program(s) are on track and **{$c['atRisk']}** need attention.

        ## Highlights
        - **Execution:** {$c['open']} open tasks, {$c['review']} in review, {$c['overdue']} overdue.
        - **Programs:** {$c['onTrack']} on track / completed, {$c['atRisk']} at risk or delayed.
        - **Customer:** {$c['openRequests']} open request(s), {$c['breached']} with a breached SLA.
        - **Competency:** {$c['competencyGaps']} competency area(s) below required level.

        ## Risks
        - {$c['atRisk']} program(s) at risk/delayed may slip milestones without intervention.
        - {$c['breached']} SLA breach(es) require an immediate PIC assignment.

        ## Recommendations
        1. Escalate and clear the {$c['review']} item(s) waiting in review.
        2. Prioritise the top competency gaps to lift the index toward target.
        3. Assign owners to breached SLA tickets and rebalance workload on at-risk programs.

        _Generated by NEXUS._
        MD;
    }
}
