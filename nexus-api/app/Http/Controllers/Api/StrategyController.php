<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StrategyGoal;
use App\Models\StrategyItem;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Strategy — the corporate strategy artifact (Vision, Mission, Core Values,
 * SWOT, Strategic Goals). Global (one company strategy); objectives.view to
 * read, objectives.manage to write. Items/goals upsert by their client id so
 * edits/deletes hit the right row.
 */
class StrategyController extends Controller
{
    /** One call hydrates the whole Strategy page. */
    public function index(): JsonResponse
    {
        $items = StrategyItem::orderBy('position')->orderBy('id')->get();
        $vision = $items->firstWhere('kind', 'vision');

        return response()->json(['data' => [
            'vision' => $vision->text ?? '',
            'mission' => $items->where('kind', 'mission')->map->toClient()->values(),
            'values' => $items->where('kind', 'value')->map->toClient()->values(),
            'swot' => $items->where('kind', 'swot')->map->toClient()->values(),
            'goals' => StrategyGoal::orderBy('code')->orderBy('id')->get()->map->toClient()->values(),
        ]]);
    }

    public function putVision(Request $request): JsonResponse
    {
        $data = $request->validate(['vision' => ['nullable', 'string']]);
        $user = $request->user();
        StrategyItem::updateOrCreate(
            ['item_id' => 'vision'],
            ['kind' => 'vision', 'text' => $data['vision'] ?? '', 'updated_by' => $user->id, 'created_by' => $user->id],
        );
        Audit::record('strategy.vision', ['user' => $user]);

        return response()->json(['data' => ['vision' => $data['vision'] ?? '']]);
    }

    /** Upsert a mission / core value / SWOT item (keyed by its client id). */
    public function itemUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kind' => ['required', 'in:mission,value,swot'],
            'id' => ['required', 'string', 'max:255'],
            'text' => ['nullable', 'string'],
            'letter' => ['nullable', 'string', 'max:8'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'max:32'], // SWOT type
            'position' => ['nullable', 'integer'],
        ]);

        $user = $request->user();
        $existing = StrategyItem::where('item_id', $data['id'])->first();
        $item = StrategyItem::updateOrCreate(
            ['item_id' => $data['id']],
            [
                'kind' => $data['kind'],
                'text' => $data['text'] ?? null,
                'letter' => $data['letter'] ?? null,
                'title' => $data['title'] ?? null,
                'description' => $data['description'] ?? null,
                'swot_type' => $data['type'] ?? null,
                'position' => $data['position'] ?? ($existing->position ?? 0),
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        return response()->json(['data' => $item->toClient()]);
    }

    public function itemDestroy(Request $request, string $id): JsonResponse
    {
        StrategyItem::where('item_id', $id)->delete();
        Audit::record('strategy.item.delete', ['user' => $request->user(), 'target' => $id]);

        return response()->json(['data' => ['deleted' => $id]]);
    }

    public function goalUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64'],
            'division' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'target' => ['nullable', 'string', 'max:64'],
            'owner' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'strategies' => ['nullable', 'array'],
            'strategies.*.strategy' => ['nullable', 'string'],
            'strategies.*.programs' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $existing = StrategyGoal::where('goal_id', $data['id'])->first();
        $goal = StrategyGoal::updateOrCreate(
            ['goal_id' => $data['id']],
            [
                'code' => $data['code'] ?? null,
                'division' => $data['division'] ?? null,
                'title' => $data['title'],
                'target' => $data['target'] ?? null,
                'owner' => $data['owner'] ?? null,
                'description' => $data['description'] ?? null,
                'strategies' => $data['strategies'] ?? [],
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        return response()->json(['data' => $goal->toClient()]);
    }

    public function goalDestroy(Request $request, string $id): JsonResponse
    {
        StrategyGoal::where('goal_id', $id)->delete();
        Audit::record('strategy.goal.delete', ['user' => $request->user(), 'target' => $id]);

        return response()->json(['data' => ['deleted' => $id]]);
    }
}
