<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ObjectiveResource;
use App\Models\Objective;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObjectiveController extends Controller
{
    public function index()
    {
        return ObjectiveResource::collection(
            Objective::with(['owner', 'keyResults'])->orderBy('id')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->attributes($request);
        $data['owner_id'] = $request->user()->id; // creator owns the objective

        $objective = Objective::create($data);
        $objective->load(['owner', 'keyResults']);

        return response()->json(['data' => new ObjectiveResource($objective)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $objective = Objective::findOrFail($this->numericId($id));
        $objective->update($this->attributes($request));
        $objective->load(['owner', 'keyResults']);

        return response()->json(['data' => new ObjectiveResource($objective)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $objective = Objective::findOrFail($this->numericId($id));
        $objective->delete();

        return response()->json(['data' => ['id' => $id]]);
    }

    /** The API exposes ids as "okr-<n>"; map back to the numeric primary key. */
    private function numericId(string $id): int
    {
        return (int) str_replace('okr-', '', $id);
    }

    private function attributes(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'quarter' => ['required', 'in:Q1,Q2,Q3,Q4'],
            'progress' => ['required', 'integer', 'between:0,100'],
        ]);
    }
}
