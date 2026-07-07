<?php

namespace App\Http\Controllers\Api;

use Anthropic\Client;
use Anthropic\Messages\RawContentBlockDeltaEvent;
use Anthropic\Messages\TextDelta;
use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Models\ChatMessage;
use App\Models\ChatThread;
use App\Models\Competency;
use App\Models\PerformanceKpi;
use App\Models\Program;
use App\Models\ServiceRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AiController extends Controller
{
    public function insights(): JsonResponse
    {
        return response()->json([
            'insights' => AiInsight::orderBy('position')->get()->map(fn ($i) => [
                'id' => 'ai'.$i->id,
                'type' => $i->type,
                'title' => $i->title,
                'body' => $i->body,
                'confidence' => $i->confidence,
            ]),
            'suggestions' => [
                'Generate Q3 executive summary',
                'Draft IDP for Rani Kusuma',
                'Predict delays across all programs',
                'Suggest priority for my open tasks',
                'Summarize last meeting minutes',
                'Recommend training for Analytics gaps',
            ],
        ]);
    }

    /**
     * Non-streaming assistant reply. Uses Claude Opus 4.8 when ANTHROPIC_API_KEY
     * is set; otherwise a deterministic rule-based reply. Persists both turns.
     */
    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'thread_id' => ['required', 'integer'],
        ]);
        $userId = $request->user()->id;
        $thread = ChatThread::where('user_id', $userId)->findOrFail($data['thread_id']);
        $context = $this->liveContext();
        $this->titleIfEmpty($thread, $data['message']);
        $this->persist($userId, $thread->id, 'user', $data['message']);
        $thread->touch();

        $key = config('services.anthropic.key');
        if ($key) {
            try {
                $reply = $this->claudeReply($key, $data['message'], $context);
                $this->persist($userId, $thread->id, 'ai', $reply, 'claude');

                return response()->json(['reply' => $reply, 'context' => $context, 'source' => 'claude']);
            } catch (Throwable $e) {
                // Fall through to the deterministic reply.
            }
        }

        $reply = $this->ruleBasedReply($data['message'], $context);
        $this->persist($userId, $thread->id, 'ai', $reply, 'rules');

        return response()->json(['reply' => $reply, 'context' => $context, 'source' => 'rules']);
    }

    /**
     * Server-Sent Events stream — emits the reply token-by-token and persists it.
     */
    public function chatStream(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'thread_id' => ['required', 'integer'],
        ]);
        $userId = $request->user()->id;
        $thread = ChatThread::where('user_id', $userId)->findOrFail($data['thread_id']);
        $context = $this->liveContext();
        $key = config('services.anthropic.key');
        $message = $data['message'];

        return response()->stream(function () use ($key, $message, $context, $userId, $thread) {
            $emit = function (array $payload) {
                echo 'data: '.json_encode($payload)."\n\n";
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
            };

            $this->titleIfEmpty($thread, $message);
            $this->persist($userId, $thread->id, 'user', $message);
            $thread->touch();

            // 1) Stream from Claude.
            if ($key) {
                try {
                    $client = new Client(apiKey: $key);
                    $stream = $client->messages->createStream(
                        model: config('services.anthropic.model', 'claude-opus-4-8'),
                        maxTokens: 1024,
                        system: $this->systemPrompt($context),
                        messages: [['role' => 'user', 'content' => $message]],
                    );

                    $full = '';
                    foreach ($stream as $event) {
                        if (connection_aborted()) {
                            return; // client pressed Stop
                        }
                        if ($event instanceof RawContentBlockDeltaEvent && $event->delta instanceof TextDelta) {
                            $full .= $event->delta->text;
                            $emit(['type' => 'delta', 'text' => $event->delta->text]);
                        }
                    }

                    if ($full !== '') {
                        $this->persist($userId, $thread->id, 'ai', $full, 'claude');
                        $emit(['type' => 'done', 'source' => 'claude']);

                        return;
                    }
                } catch (Throwable $e) {
                    // Fall through to the simulated stream below.
                }
            }

            // 2) Fallback: stream the deterministic reply word-by-word.
            $reply = $this->ruleBasedReply($message, $context);
            $chunks = preg_split('/(\s+)/', $reply, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [$reply];
            foreach ($chunks as $chunk) {
                if (connection_aborted()) {
                    return;
                }
                if ($chunk === '') {
                    continue;
                }
                $emit(['type' => 'delta', 'text' => $chunk]);
                usleep(25000); // ~25ms — a natural typing cadence
            }
            $this->persist($userId, $thread->id, 'ai', $reply, 'rules');
            $emit(['type' => 'done', 'source' => 'rules']);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function persist(int $userId, int $threadId, string $role, string $text, ?string $source = null): void
    {
        ChatMessage::create([
            'user_id' => $userId,
            'thread_id' => $threadId,
            'role' => $role,
            'text' => $text,
            'source' => $source,
        ]);
    }

    /** Name a fresh thread after its first user message. */
    private function titleIfEmpty(ChatThread $thread, string $message): void
    {
        if (! $thread->messages()->exists()) {
            $title = Str::limit(trim($message), 40, '…');
            $thread->update(['title' => $title !== '' ? $title : 'New chat']);
        }
    }

    private function claudeReply(string $key, string $message, array $ctx): string
    {
        $client = new Client(apiKey: $key);

        $response = $client->messages->create(
            model: config('services.anthropic.model', 'claude-opus-4-8'),
            maxTokens: 1024,
            system: $this->systemPrompt($ctx),
            messages: [['role' => 'user', 'content' => $message]],
        );

        $text = '';
        foreach ($response->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text;
            }
        }

        $text = trim($text);
        if ($text === '') {
            throw new \RuntimeException('Empty response from Claude');
        }

        return $text;
    }

    private function systemPrompt(array $ctx): string
    {
        return <<<SYS
        You are the NEXUS AI Assistant for the Competency & Performance Management department.
        NEXUS connects People → Competency → Execution → Performance → Customer Value → Organizational Excellence.
        Answer as a concise, professional executive copilot. Ground every answer in the live data below.
        Prefer specific numbers over generalities, keep replies under ~120 words, and end with one actionable next step.

        LIVE DATA (current snapshot):
        - Open tasks: {$ctx['open']} (overdue: {$ctx['overdue']}, awaiting approval/review: {$ctx['review']})
        - Programs at risk or delayed: {$ctx['atRisk']}
        - Open customer/service requests: {$ctx['openRequests']} (SLA breached: {$ctx['breached']})
        - Weighted overall KPI achievement: {$ctx['overallKpi']}% (target 90%)
        - Competency gaps (current < required): {$ctx['competencyGaps']}
        Top programs: {$ctx['programList']}
        SYS;
    }

    private function ruleBasedReply(string $message, array $ctx): string
    {
        $msg = Str::lower($message);

        if (Str::contains($msg, ['delay', 'risk', 'predict'])) {
            return "Risk scan complete. {$ctx['atRisk']} program(s) are At Risk or Delayed and {$ctx['overdue']} task(s) are overdue. "
                ."I recommend rebalancing workload and escalating the {$ctx['review']} item(s) waiting in Review.";
        }
        if (Str::contains($msg, ['summary', 'report', 'executive'])) {
            return "Executive summary: {$ctx['open']} open tasks ({$ctx['overdue']} overdue), {$ctx['review']} awaiting approval, "
                ."{$ctx['atRisk']} program(s) needing attention, and {$ctx['openRequests']} open customer request(s). Overall KPI is at {$ctx['overallKpi']}%.";
        }
        if (Str::contains($msg, ['request', 'sla', 'customer'])) {
            return "There are {$ctx['openRequests']} open service request(s), {$ctx['breached']} with a breached SLA. "
                .'Prioritize the breached ticket(s) and assign a PIC to any unassigned high-priority requests.';
        }
        if (Str::contains($msg, ['priority', 'task', 'workload'])) {
            return "You have {$ctx['open']} open task(s). Suggested focus order: overdue ({$ctx['overdue']}) → in Review ({$ctx['review']}) → "
                .'critical priority. Want me to auto-assign priorities?';
        }

        return "Here's what I see across your connected NEXUS data: {$ctx['open']} open tasks, {$ctx['overdue']} overdue, "
            ."{$ctx['review']} awaiting approval, {$ctx['atRisk']} program(s) at risk, {$ctx['openRequests']} open request(s). "
            .'Ask me to summarize, predict delays, or recommend actions.';
    }

    /**
     * @return array<string, mixed>
     */
    private function liveContext(): array
    {
        $today = now()->toDateString();

        return [
            'open' => Task::whereNot('status', 'Done')->count(),
            'overdue' => Task::whereNot('status', 'Done')->whereDate('due_date', '<', $today)->count(),
            'review' => Task::where('status', 'Review')->count(),
            'atRisk' => Program::whereIn('status', ['At Risk', 'Delayed'])->count(),
            'openRequests' => ServiceRequest::whereNot('status', 'Resolved')->count(),
            'breached' => ServiceRequest::where('sla', 'Breached')->count(),
            'overallKpi' => $this->overallKpi(),
            'competencyGaps' => Competency::whereColumn('current_level', '<', 'required_level')->count(),
            'programList' => Program::orderBy('id')->pluck('name')->take(5)->implode(', '),
        ];
    }

    private function overallKpi(): int
    {
        $sum = PerformanceKpi::all()->sum(function ($k) {
            $ratio = $k->target > 0 ? min(1.1, $k->actual / $k->target) : 0;

            return $ratio * $k->weight;
        });

        return (int) round($sum);
    }
}
