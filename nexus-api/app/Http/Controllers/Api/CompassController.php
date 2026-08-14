<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompassAssessmentRecord;
use App\Models\CompassCertification;
use App\Models\CompassJourney;
use App\Models\CompassLmsModule;
use App\Models\CompassMentoringSession;
use App\Models\CompetencyCurrentLevel;
use App\Models\JobDescription;
use App\Models\OjtItem;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * COMPASS — the editable Competency Development surfaces: Gap Analysis current
 * levels, Job Profile descriptions and OJT progress.
 *
 * Reads need competency.view, writes competency.manage. Each surface is small and
 * independent, so they share one controller rather than three near-empty ones.
 */
class CompassController extends Controller
{
    // ---- Gap Analysis: current level per employee per competency ----------

    /** Returned as the page's flat `npk|code` → level map. */
    public function currentLevels(): JsonResponse
    {
        $map = CompetencyCurrentLevel::all()
            ->mapWithKeys(fn (CompetencyCurrentLevel $r) => [$r->npk.'|'.$r->comp_code => $r->level]);

        return response()->json(['data' => (object) $map->all()]);
    }

    public function putCurrentLevel(Request $request): JsonResponse
    {
        $data = $request->validate([
            'npk' => ['required', 'string', 'max:255'],
            'comp_code' => ['required', 'string', 'max:64'],
            'level' => ['required', 'integer', 'between:0,20'],
        ]);

        CompetencyCurrentLevel::updateOrCreate(
            ['npk' => $data['npk'], 'comp_code' => $data['comp_code']],
            ['level' => $data['level'], 'updated_by' => $request->user()?->id]
        );

        Audit::record('competency_current_level.upsert', [
            'user' => $request->user(),
            'target' => $data['npk'].'/'.$data['comp_code'],
            'meta' => ['level' => $data['level']],
        ]);

        return response()->json(['data' => ['ok' => true]]);
    }

    // ---- Job Profile: job descriptions per jabatan ------------------------

    /** Returned as the page's `jabatanKey` → JobDesc map. */
    public function jobDescriptions(): JsonResponse
    {
        $map = JobDescription::all()->mapWithKeys(fn (JobDescription $d) => [$d->desc_key => $d->toClient()]);

        return response()->json(['data' => (object) $map->all()]);
    }

    /**
     * Upsert one or many job descriptions.
     *
     * The page saves one profile at a time when editing, but a .docx/.xlsx import
     * produces a whole batch — both go through here so an import is one request
     * instead of one per jabatan.
     */
    public function putJobDescriptions(Request $request): JsonResponse
    {
        $request->validate(['items' => ['required', 'array', 'min:1']]);
        $userId = $request->user()?->id;

        $items = collect($request->input('items'))->map(function ($item) {
            return Validator::make(is_array($item) ? $item : [], [
                'desc_key' => ['required', 'string', 'max:255'],
                'jabatan_name' => ['nullable', 'string', 'max:255'],
                'kode_jabatan' => ['nullable', 'string', 'max:255'],
                'direktorat' => ['nullable', 'string', 'max:255'],
                'kompartemen' => ['nullable', 'string', 'max:255'],
                'departemen' => ['nullable', 'string', 'max:255'],
                'purpose' => ['nullable', 'string'],
                'responsibilities' => ['nullable', 'array'],
                'dimensi' => ['nullable', 'string'],
                'authority' => ['nullable', 'string'],
                'relations' => ['nullable', 'string'],
                'qualifications' => ['nullable', 'string'],
                'certifications' => ['nullable', 'string'],
                'risks' => ['nullable', 'string'],
            ])->validate();
        })->all();

        DB::transaction(function () use ($items, $userId) {
            foreach ($items as $item) {
                $key = $item['desc_key'];
                unset($item['desc_key']);
                JobDescription::updateOrCreate(['desc_key' => $key], $item + ['updated_by' => $userId]);
            }
        });

        Audit::record('job_description.upsert', ['user' => $request->user(), 'meta' => ['count' => count($items)]]);

        return response()->json(['data' => ['saved' => count($items)]]);
    }

    // ---- OJT & Job Shadowing ---------------------------------------------

    public function ojt(): JsonResponse
    {
        return response()->json(['data' => OjtItem::orderBy('kind')->orderBy('employee')->get()->map(fn (OjtItem $o) => $o->toClient())]);
    }

    // ---- Tracking modules (LMS · Journey · Mentoring · Certification · Assessment) ----
    //
    // Five small catalogues that behave identically: list all, upsert one by its
    // client id, delete one. They share the helpers at the bottom rather than
    // repeating the same three methods five times over.

    public function lms(): JsonResponse
    {
        return $this->listOf(CompassLmsModule::class, fn ($q) => $q->orderBy('title'));
    }

    public function putLms(Request $request): JsonResponse
    {
        return $this->upsert($request, CompassLmsModule::class, 'module_id', [
            'title' => ['required', 'string', 'max:255'],
            'competency' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:32'],
            'duration' => ['nullable', 'string', 'max:64'],
            'level' => ['required', 'integer', 'between:1,20'],
        ]);
    }

    public function destroyLms(Request $request, string $id): JsonResponse
    {
        return $this->remove(CompassLmsModule::class, 'module_id', $id, $request);
    }

    public function journeys(): JsonResponse
    {
        return $this->listOf(CompassJourney::class, fn ($q) => $q->orderBy('employee'));
    }

    public function putJourney(Request $request): JsonResponse
    {
        return $this->upsert($request, CompassJourney::class, 'journey_id', [
            'employee' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'weeks' => ['nullable', 'array'],
            'weeks.*.week' => ['required', 'integer', 'between:1,104'],
            'weeks.*.items' => ['nullable', 'array'],
            'weeks.*.items.*' => ['string'],
            'progress' => ['required', 'integer', 'between:0,100'],
        ]);
    }

    public function destroyJourney(Request $request, string $id): JsonResponse
    {
        return $this->remove(CompassJourney::class, 'journey_id', $id, $request);
    }

    public function mentoring(): JsonResponse
    {
        return $this->listOf(CompassMentoringSession::class, fn ($q) => $q->orderByDesc('date'));
    }

    public function putMentoring(Request $request): JsonResponse
    {
        return $this->upsert($request, CompassMentoringSession::class, 'session_id', [
            'employee' => ['required', 'string', 'max:255'],
            'mentor' => ['nullable', 'string', 'max:255'],
            'kind' => ['required', 'string', 'max:32'],
            'topic' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'actionPlan' => ['nullable', 'string'],
            'date' => ['nullable', 'date'],
        ], ['actionPlan' => 'action_plan']);
    }

    public function destroyMentoring(Request $request, string $id): JsonResponse
    {
        return $this->remove(CompassMentoringSession::class, 'session_id', $id, $request);
    }

    public function certifications(): JsonResponse
    {
        return $this->listOf(CompassCertification::class, fn ($q) => $q->orderByDesc('issued'));
    }

    public function putCertification(Request $request): JsonResponse
    {
        return $this->upsert($request, CompassCertification::class, 'cert_id', [
            'employee' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:64'],
            'status' => ['required', 'string', 'max:32'],
            'issued' => ['nullable', 'date'],
            'expires' => ['nullable', 'date'],
        ]);
    }

    public function destroyCertification(Request $request, string $id): JsonResponse
    {
        return $this->remove(CompassCertification::class, 'cert_id', $id, $request);
    }

    public function assessments(): JsonResponse
    {
        return $this->listOf(CompassAssessmentRecord::class, fn ($q) => $q->orderByDesc('date'));
    }

    public function putAssessmentRecord(Request $request): JsonResponse
    {
        return $this->upsert($request, CompassAssessmentRecord::class, 'record_id', [
            'employee' => ['required', 'string', 'max:255'],
            'competency' => ['nullable', 'string', 'max:255'],
            'method' => ['required', 'string', 'max:32'],
            'assessor' => ['nullable', 'string', 'max:255'],
            // nullable, not "required|integer": an ungraded record has no score,
            // which is different from scoring zero.
            'score' => ['nullable', 'integer', 'between:0,100'],
            'status' => ['required', 'string', 'max:32'],
            'date' => ['nullable', 'date'],
        ]);
    }

    public function destroyAssessmentRecord(Request $request, string $id): JsonResponse
    {
        return $this->remove(CompassAssessmentRecord::class, 'record_id', $id, $request);
    }

    // ---- shared helpers for the five tracking modules ---------------------

    /** @param  class-string  $model */
    private function listOf(string $model, callable $order): JsonResponse
    {
        return response()->json(['data' => $order($model::query())->get()->map(fn ($row) => $row->toClient())]);
    }

    /**
     * Upsert one record by its client id.
     *
     * @param  class-string  $model
     * @param  array<string,string>  $columnMap  payload key => column, for the few camelCase fields
     */
    private function upsert(Request $request, string $model, string $key, array $rules, array $columnMap = []): JsonResponse
    {
        $data = $request->validate(['id' => ['required', 'string', 'max:255']] + $rules);
        $id = $data['id'];
        unset($data['id']);

        foreach ($columnMap as $from => $to) {
            if (array_key_exists($from, $data)) {
                $data[$to] = $data[$from];
                unset($data[$from]);
            }
        }
        $data['updated_by'] = $request->user()?->id;

        $row = $model::updateOrCreate([$key => $id], $data);
        Audit::record('compass.upsert', ['user' => $request->user(), 'target' => $id, 'meta' => ['type' => class_basename($model)]]);

        return response()->json(['data' => $row->toClient()]);
    }

    /** @param  class-string  $model */
    private function remove(string $model, string $key, string $id, Request $request): JsonResponse
    {
        $row = $model::where($key, $id)->first();
        if (! $row) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $row->delete();
        Audit::record('compass.delete', ['user' => $request->user(), 'target' => $id, 'meta' => ['type' => class_basename($model)]]);

        return response()->json(['data' => ['deleted' => $id]]);
    }

    public function putOjt(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_id' => ['required', 'string', 'max:255'],
            'employee' => ['required', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
            'kind' => ['required', 'string', 'max:64'],
            'activity' => ['nullable', 'string'],
            'mentor' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:32'],
        ]);

        $item = OjtItem::updateOrCreate(
            ['item_id' => $data['item_id']],
            [
                'employee' => $data['employee'],
                'role' => $data['role'] ?? null,
                'kind' => $data['kind'],
                'activity' => $data['activity'] ?? null,
                'mentor' => $data['mentor'] ?? null,
                'status' => $data['status'],
                'updated_by' => $request->user()?->id,
            ]
        );

        Audit::record('ojt_item.upsert', ['user' => $request->user(), 'target' => $item->item_id, 'meta' => ['status' => $item->status]]);

        return response()->json(['data' => $item->toClient()]);
    }
}
