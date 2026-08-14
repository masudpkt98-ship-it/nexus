<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetencyAssessment;
use App\Models\CompetencyStandard;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Competency Matrix — required standards per group and assessed levels per
 * employee (/competency/matrix).
 *
 * One GET hydrates the whole page (like /strategy) because the matrix renders
 * standards and assessments together; writes are single-cell/single-row upserts
 * so an edit costs one small request. Reads need competency.view, writes
 * competency.manage.
 */
class CompetencyMatrixController extends Controller
{
    /** Both halves of the matrix, shaped as the page's group-keyed maps. */
    public function index(): JsonResponse
    {
        $standards = CompetencyStandard::orderBy('group_key')->get()
            ->groupBy('group_key')
            ->map(fn ($rows) => (object) $rows->pluck('required_level', 'comp_id')->all());

        $assessments = CompetencyAssessment::orderBy('group_key')->orderBy('name')->get()
            ->groupBy('group_key')
            ->map(fn ($rows) => $rows->map(fn (CompetencyAssessment $a) => $a->toClient())->values());

        return response()->json(['data' => [
            'standards' => (object) $standards->all(),
            'assessments' => (object) $assessments->all(),
        ]]);
    }

    /** Set (or clear) the required level for one competency in one group. */
    public function putStandard(Request $request): JsonResponse
    {
        $data = $request->validate([
            'group_key' => ['required', 'string', 'max:255'],
            'comp_id' => ['required', 'string', 'max:255'],
            'required_level' => ['required', 'integer', 'between:0,20'],
        ]);

        CompetencyStandard::updateOrCreate(
            ['group_key' => $data['group_key'], 'comp_id' => $data['comp_id']],
            ['required_level' => $data['required_level'], 'updated_by' => $request->user()?->id]
        );

        Audit::record('competency_standard.upsert', [
            'user' => $request->user(),
            'target' => $data['group_key'].'/'.$data['comp_id'],
            'meta' => ['required' => $data['required_level']],
        ]);

        return response()->json(['data' => ['ok' => true]]);
    }

    /**
     * Create/update one assessed employee inside a group.
     *
     * The page edits one cell at a time but always holds the employee's full level
     * map, so it sends the whole row — that keeps the write idempotent and avoids
     * a read-modify-write race between two cells edited in quick succession.
     */
    public function putAssessment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'group_key' => ['required', 'string', 'max:255'],
            'npk' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'levels' => ['nullable', 'array'],
            'levels.*' => ['integer', 'between:0,20'],
        ]);

        CompetencyAssessment::updateOrCreate(
            ['group_key' => $data['group_key'], 'npk' => $data['npk']],
            ['name' => $data['name'], 'levels' => $data['levels'] ?? [], 'updated_by' => $request->user()?->id]
        );

        Audit::record('competency_assessment.upsert', [
            'user' => $request->user(),
            'target' => $data['group_key'].'/'.$data['npk'],
        ]);

        return response()->json(['data' => ['ok' => true]]);
    }

    /**
     * Remove one assessed employee from a group. Group keys are free text (Job
     * Family names with spaces and slashes), so they travel as query parameters
     * rather than path segments.
     */
    public function destroyAssessment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'group_key' => ['required', 'string', 'max:255'],
            'npk' => ['required', 'string', 'max:255'],
        ]);

        CompetencyAssessment::where('group_key', $data['group_key'])->where('npk', $data['npk'])->delete();
        Audit::record('competency_assessment.delete', [
            'user' => $request->user(),
            'target' => $data['group_key'].'/'.$data['npk'],
        ]);

        return response()->json(['data' => ['deleted' => $data['npk']]]);
    }
}
