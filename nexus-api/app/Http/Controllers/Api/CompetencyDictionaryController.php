<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompetencyLevel;
use App\Models\DictionaryCompetency;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Kamus Kompetensi — the competency catalogue plus its proficiency scale.
 *
 * Global (not unit-scoped): the Matrix, Gap Analysis and Job Profile pages all
 * resolve against this one catalogue. Reads need competency.view, writes need
 * competency.manage. Upsert is keyed by the client id (comp_id) so an edit or
 * delete always reaches the row it was made against.
 *
 * `replaceCategory` exists for the Excel import, which swaps a whole category
 * (~165 rows) in one go — a per-row loop would be that many round trips, and a
 * partial failure would leave the catalogue half-imported.
 */
class CompetencyDictionaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DictionaryCompetency::query();
        if ($c = $request->query('category')) {
            $query->where('category', $c);
        }
        $rows = $query->orderBy('code')->get()->map(fn (DictionaryCompetency $d) => $d->toClient());

        return response()->json(['data' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $this->validated($request->all());
        $comp = $this->write($data, $request->user()?->id);

        Audit::record('competency_dictionary.upsert', ['user' => $request->user(), 'target' => $comp->comp_id, 'meta' => ['code' => $comp->code]]);

        return response()->json(['data' => $comp->toClient()]);
    }

    public function destroy(Request $request, string $compId): JsonResponse
    {
        $comp = DictionaryCompetency::where('comp_id', $compId)->first();
        if (! $comp) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $comp->delete();
        Audit::record('competency_dictionary.delete', ['user' => $request->user(), 'target' => $compId]);

        return response()->json(['data' => ['deleted' => $compId]]);
    }

    /**
     * Replace every competency in one category (Excel import).
     *
     * Wrapped in a transaction so a failure mid-import leaves the previous
     * catalogue intact rather than a partially deleted one.
     */
    public function replaceCategory(Request $request): JsonResponse
    {
        $request->validate([
            'category' => ['required', 'string', 'max:60'],
            'items' => ['present', 'array'],
        ]);
        $category = $request->input('category');
        $userId = $request->user()?->id;

        $items = collect($request->input('items'))
            ->map(fn ($item) => $this->validated(is_array($item) ? $item : [], $category))
            ->all();

        DB::transaction(function () use ($category, $items, $userId) {
            DictionaryCompetency::where('category', $category)->delete();
            foreach ($items as $item) {
                $this->write($item, $userId);
            }
        });

        Audit::record('competency_dictionary.import', ['user' => $request->user(), 'target' => $category, 'meta' => ['count' => count($items)]]);

        $rows = DictionaryCompetency::where('category', $category)->orderBy('code')->get()->map(fn (DictionaryCompetency $d) => $d->toClient());

        return response()->json(['data' => $rows]);
    }

    // ---- Proficiency scale ------------------------------------------------

    public function levels(): JsonResponse
    {
        return response()->json(['data' => CompetencyLevel::orderBy('level')->get()->map(fn (CompetencyLevel $l) => $l->toClient())]);
    }

    /**
     * Replace the whole proficiency scale. The scale is five-ish rows edited as a
     * unit (rename a level, re-import from the Proficiency sheet), so sending it
     * whole avoids a per-level diff on the client.
     */
    public function putLevels(Request $request): JsonResponse
    {
        $data = $request->validate([
            'levels' => ['present', 'array'],
            'levels.*.level' => ['required', 'integer', 'between:1,20'],
            'levels.*.name' => ['required', 'string', 'max:120'],
            'levels.*.description' => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($data) {
            $keep = collect($data['levels'])->pluck('level')->all();
            CompetencyLevel::whereNotIn('level', $keep ?: [0])->delete();
            foreach ($data['levels'] as $l) {
                CompetencyLevel::updateOrCreate(
                    ['level' => $l['level']],
                    ['name' => $l['name'], 'description' => $l['description'] ?? null]
                );
            }
        });

        Audit::record('competency_levels.replace', ['user' => $request->user(), 'meta' => ['count' => count($data['levels'])]]);

        return response()->json(['data' => CompetencyLevel::orderBy('level')->get()->map(fn (CompetencyLevel $l) => $l->toClient())]);
    }

    // ---- helpers ----------------------------------------------------------

    /** @param  string|null  $category  forced category (bulk import), else taken from the payload */
    private function validated(array $payload, ?string $category = null): array
    {
        $rules = [
            'comp_id' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'definition' => ['nullable', 'string'],
            'indicators' => ['nullable', 'array'],
            'indicators.*.level' => ['required', 'integer', 'between:1,20'],
            'indicators.*.indicator' => ['nullable', 'string'],
            'key_actions' => ['nullable', 'array'],
            'key_actions.*' => ['string'],
            'job_family' => ['nullable', 'string', 'max:255'],
            'job_family_name' => ['nullable', 'string', 'max:255'],
            'function_name' => ['nullable', 'string', 'max:255'],
        ];
        $rules['category'] = $category ? ['nullable', 'string', 'max:60'] : ['required', 'string', 'max:60'];

        $data = Validator::make($payload, $rules)->validate();
        $data['category'] = $category ?? $data['category'];

        return $data;
    }

    private function write(array $data, ?int $userId): DictionaryCompetency
    {
        return DictionaryCompetency::updateOrCreate(
            ['comp_id' => $data['comp_id']],
            [
                'code' => $data['code'] ?? null,
                'name' => $data['name'],
                'category' => $data['category'],
                'definition' => $data['definition'] ?? null,
                'indicators' => $data['indicators'] ?? [],
                'key_actions' => $data['key_actions'] ?? [],
                'job_family' => $data['job_family'] ?? null,
                'job_family_name' => $data['job_family_name'] ?? null,
                'function_name' => $data['function_name'] ?? null,
                'updated_by' => $userId,
            ]
        );
    }
}
