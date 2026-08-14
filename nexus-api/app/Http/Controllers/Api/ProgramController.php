<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use App\Models\ProgramMilestone;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Program Management.
 *
 * The frontend addresses a program by its code (PRG-01) — that is what
 * ProgramResource returns as `id` — so the routes bind {program:code}. Binding by
 * the auto-increment id (the previous behaviour) made every update and delete
 * 404 against a client that had only ever seen the code.
 */
class ProgramController extends Controller
{
    public function index()
    {
        return ProgramResource::collection(
            Program::with('owner')->orderBy('id')->get()
        );
    }

    public function show(Program $program): ProgramResource
    {
        return new ProgramResource($program->load('owner'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->attributes($request);

        // The server owns the code; the client adopts it from this response.
        $data['code'] = 'PRG-'.str_pad((string) (Program::withTrashed()->max('id') + 1), 2, '0', STR_PAD_LEFT);

        $program = Program::create($data);
        Audit::record('program.create', ['user' => $request->user(), 'target' => $program->code, 'meta' => ['name' => $program->name]]);

        return (new ProgramResource($program->load('owner')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Program $program): ProgramResource
    {
        $program->update($this->attributes($request, partial: true));
        Audit::record('program.update', ['user' => $request->user(), 'target' => $program->code]);

        return new ProgramResource($program->load('owner'));
    }

    public function destroy(Request $request, Program $program): JsonResponse
    {
        // Milestones hang off the code, not a foreign key (the client owns their
        // ids), so they are cleared here rather than by a cascade.
        ProgramMilestone::where('program_code', $program->code)->delete();
        $program->delete();
        Audit::record('program.delete', ['user' => $request->user(), 'target' => $program->code]);

        return response()->json(['message' => 'Program archived.']);
    }

    // ---- Milestones -------------------------------------------------------

    public function milestones(Request $request): JsonResponse
    {
        $query = ProgramMilestone::query();
        if ($code = $request->query('program')) {
            $query->where('program_code', $code);
        }

        return response()->json(['data' => $query->orderBy('due')->get()->map(fn (ProgramMilestone $m) => $m->toClient())]);
    }

    public function milestoneUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'milestone_id' => ['required', 'string', 'max:255'],
            'program_code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'due' => ['nullable', 'date'],
            'status' => ['required', 'string', 'max:32'],
            'progress' => ['required', 'integer', 'between:0,100'],
        ]);

        $milestone = ProgramMilestone::updateOrCreate(
            ['milestone_id' => $data['milestone_id']],
            [
                'program_code' => $data['program_code'],
                'name' => $data['name'],
                'due' => $data['due'] ?? null,
                'status' => $data['status'],
                'progress' => $data['progress'],
                'updated_by' => $request->user()?->id,
            ]
        );

        Audit::record('program_milestone.upsert', ['user' => $request->user(), 'target' => $milestone->milestone_id]);

        return response()->json(['data' => $milestone->toClient()]);
    }

    public function milestoneDestroy(Request $request, string $milestoneId): JsonResponse
    {
        $milestone = ProgramMilestone::where('milestone_id', $milestoneId)->first();
        if (! $milestone) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $milestone->delete();
        Audit::record('program_milestone.delete', ['user' => $request->user(), 'target' => $milestoneId]);

        return response()->json(['data' => ['deleted' => $milestoneId]]);
    }

    // ---- helpers ----------------------------------------------------------

    /**
     * Validate and map the page's payload onto columns.
     *
     * `owner` arrives as free text from the form, so it is stored as owner_name;
     * owner_id stays available for callers that link a real user.
     */
    private function attributes(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        $data = $request->validate([
            'name' => [$req, 'string', 'max:255'],
            'owner' => ['nullable', 'string', 'max:255'],
            'owner_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'in:On Track,At Risk,Delayed,Completed'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'budget' => ['nullable', 'integer', 'min:0'],
            'spent' => ['nullable', 'integer', 'min:0'],
            'risk' => ['nullable', 'in:Low,Medium,High'],
            'milestones' => ['nullable', 'integer', 'min:0'],
            'milestonesDone' => ['nullable', 'integer', 'min:0'],
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date'],
            'goalIds' => ['nullable', 'array'],
            'goalIds.*' => ['string', 'max:255'],
            'okrIds' => ['nullable', 'array'],
            'okrIds.*' => ['string', 'max:255'],
        ]);

        $map = [
            'milestonesDone' => 'milestones_done',
            'start' => 'start_date',
            'end' => 'end_date',
            'goalIds' => 'goal_ids',
            'okrIds' => 'okr_ids',
            'owner' => 'owner_name',
        ];
        foreach ($map as $from => $to) {
            if (array_key_exists($from, $data)) {
                $data[$to] = $data[$from];
                unset($data[$from]);
            }
        }

        return $data;
    }
}
