<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
