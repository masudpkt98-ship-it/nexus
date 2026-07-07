<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeneratedArtifact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Saved AI generator artifacts (KPI / IDP / Report), scoped per user so history
 * follows the account across devices.
 */
class ArtifactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = GeneratedArtifact::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => $this->summary($a));

        return response()->json(['data' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kind' => ['required', 'in:kpi,idp,report'],
            'title' => ['required', 'string', 'max:160'],
            'markdown' => ['required', 'string', 'max:20000'],
            'source' => ['nullable', 'in:claude,rules,stopped'],
            'params' => ['nullable', 'array'],
        ]);
        $data['user_id'] = $request->user()->id;

        $artifact = GeneratedArtifact::create($data);

        return response()->json(['data' => $this->full($artifact)], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $artifact = GeneratedArtifact::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json(['data' => $this->full($artifact)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $artifact = GeneratedArtifact::where('user_id', $request->user()->id)->findOrFail($id);
        $artifact->delete();

        return response()->json(['data' => ['id' => $id]]);
    }

    private function summary(GeneratedArtifact $a): array
    {
        return [
            'id' => $a->id,
            'kind' => $a->kind,
            'title' => $a->title,
            'source' => $a->source,
            'createdAt' => $a->created_at?->toIso8601String(),
        ];
    }

    private function full(GeneratedArtifact $a): array
    {
        return array_merge($this->summary($a), [
            'markdown' => $a->markdown,
            'params' => $a->params,
        ]);
    }
}
