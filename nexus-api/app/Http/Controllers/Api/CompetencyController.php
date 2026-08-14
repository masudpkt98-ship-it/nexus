<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompetencyResource;
use App\Http\Resources\DevelopmentPlanResource;
use App\Models\Competency;
use App\Models\DevelopmentPlan;
use App\Models\NotificationItem;
use App\Models\TrainingSession;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetencyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'competencies' => CompetencyResource::collection(Competency::orderBy('id')->get()),
            'developmentPlans' => DevelopmentPlanResource::collection(DevelopmentPlan::orderByDesc('readiness')->get()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $competency = Competency::create($this->attributes($request));
        NotificationItem::raise("New competency added: {$competency->name}", 'In-App', 'competency');

        return response()->json(['data' => new CompetencyResource($competency)], 201);
    }

    public function update(Request $request, Competency $competency): JsonResponse
    {
        $competency->update($this->attributes($request));

        return response()->json(['data' => new CompetencyResource($competency)]);
    }

    public function destroy(Competency $competency): JsonResponse
    {
        $competency->delete();

        return response()->json(['data' => ['id' => $competency->id]]);
    }

    /**
     * Create/update one development plan, keyed by the client id (plan_id).
     *
     * The hub owns the id (`dp-…`) so an edit or delete always reaches the row it
     * was made against — the auto-increment id is never exposed to the frontend.
     */
    public function planUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'string', 'max:255'],
            'employee' => ['required', 'string', 'max:120'],
            'avatar' => ['nullable', 'string', 'max:4'],
            'role' => ['nullable', 'string', 'max:120'],
            'readiness' => ['required', 'integer', 'between:0,100'],
            'gaps' => ['required', 'integer', 'min:0'],
            'nextStep' => ['nullable', 'string', 'max:255'],
        ]);

        $plan = DevelopmentPlan::updateOrCreate(
            ['plan_id' => $data['plan_id']],
            [
                'employee' => $data['employee'],
                'avatar' => $data['avatar'] ?? null,
                'role' => $data['role'] ?? '—',
                'readiness' => $data['readiness'],
                'gaps' => $data['gaps'],
                'next_step' => $data['nextStep'] ?? null,
            ]
        );

        Audit::record('development_plan.upsert', ['user' => $request->user(), 'target' => $plan->plan_id, 'meta' => ['employee' => $plan->employee]]);

        return response()->json(['data' => new DevelopmentPlanResource($plan)]);
    }

    public function planDestroy(Request $request, string $planId): JsonResponse
    {
        $plan = DevelopmentPlan::where('plan_id', $planId)->first();
        if (! $plan) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $plan->delete();
        Audit::record('development_plan.delete', ['user' => $request->user(), 'target' => $planId]);

        return response()->json(['data' => ['deleted' => $planId]]);
    }

    // ---- Training calendar (Development page, alongside the plans above) ----

    public function trainingSessions(): JsonResponse
    {
        return response()->json(['data' => TrainingSession::orderBy('position')->orderBy('id')->get()->map(fn (TrainingSession $s) => $s->toClient())]);
    }

    public function trainingUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            // Both are display labels the page renders verbatim, not parsed values.
            'date' => ['nullable', 'string', 'max:255'],
            'seats' => ['nullable', 'string', 'max:64'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $session = TrainingSession::updateOrCreate(
            ['session_id' => $data['id']],
            [
                'name' => $data['name'],
                'date' => $data['date'] ?? null,
                'seats' => $data['seats'] ?? null,
                'position' => $data['position'] ?? 0,
                'updated_by' => $request->user()?->id,
            ]
        );

        Audit::record('training_session.upsert', ['user' => $request->user(), 'target' => $session->session_id]);

        return response()->json(['data' => $session->toClient()]);
    }

    public function trainingDestroy(Request $request, string $sessionId): JsonResponse
    {
        $session = TrainingSession::where('session_id', $sessionId)->first();
        if (! $session) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $session->delete();
        Audit::record('training_session.delete', ['user' => $request->user(), 'target' => $sessionId]);

        return response()->json(['data' => ['deleted' => $sessionId]]);
    }

    /** Validate the API payload and map current/required to the *_level columns. */
    private function attributes(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', 'string', 'max:60'],
            'current' => ['required', 'integer', 'between:1,5'],
            'required' => ['required', 'integer', 'between:1,5'],
        ]);

        return [
            'name' => $data['name'],
            'category' => $data['category'],
            'current_level' => $data['current'],
            'required_level' => $data['required'],
        ];
    }
}
