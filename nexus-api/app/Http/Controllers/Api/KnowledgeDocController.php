<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\KnowledgeDocResource;
use App\Models\KnowledgeDoc;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Knowledge Base documents.
 *
 * Writes share knowledge.view — the module is ungated in the UI and the RBAC map
 * has no knowledge.manage; the same call already made for Documents.
 *
 * POST upserts a whole document by its client id; PUT patches only the fields
 * sent, because the page also bumps a version on its own (`{version: "v3.3"}`)
 * without resending the rest of the record.
 */
class KnowledgeDocController extends Controller
{
    public function index(Request $request)
    {
        $query = KnowledgeDoc::query();

        if ($request->filled('category') && $request->string('category') !== 'All') {
            $query->where('category', $request->string('category'));
        }
        if ($request->filled('q')) {
            $query->where('title', 'like', '%'.$request->string('q').'%');
        }

        return KnowledgeDocResource::collection($query->orderByDesc('updated_on')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:120'],
            'version' => ['nullable', 'string', 'max:32'],
            'type' => ['nullable', 'in:SOP,Guideline,Template,Presentation'],
            'approval' => ['nullable', 'in:Approved,Pending'],
            'owner' => ['nullable', 'string', 'max:255'],
            'updated' => ['nullable', 'date'],
        ]);

        $doc = KnowledgeDoc::updateOrCreate(
            ['doc_id' => $data['id']],
            [
                'title' => $data['title'],
                'category' => $data['category'] ?? 'General',
                'version' => $data['version'] ?? 'v1.0',
                'type' => $data['type'] ?? 'SOP',
                'approval' => $data['approval'] ?? 'Approved',
                'owner' => $data['owner'] ?? null,
                'updated_on' => $data['updated'] ?? now()->toDateString(),
            ]
        );

        Audit::record('knowledge_doc.upsert', ['user' => $request->user(), 'target' => $doc->doc_id, 'meta' => ['title' => $doc->title]]);

        return response()->json(['data' => new KnowledgeDocResource($doc)]);
    }

    public function update(Request $request, string $docId): JsonResponse
    {
        $doc = KnowledgeDoc::where('doc_id', $docId)->first();
        if (! $doc) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'max:120'],
            'version' => ['sometimes', 'string', 'max:32'],
            'type' => ['sometimes', 'in:SOP,Guideline,Template,Presentation'],
            'approval' => ['sometimes', 'in:Approved,Pending'],
            'owner' => ['sometimes', 'string', 'max:255'],
            'updated' => ['sometimes', 'date'],
        ]);

        if (array_key_exists('updated', $data)) {
            $data['updated_on'] = $data['updated'];
            unset($data['updated']);
        } else {
            $data['updated_on'] = now()->toDateString();
        }

        $doc->update($data);
        Audit::record('knowledge_doc.update', ['user' => $request->user(), 'target' => $doc->doc_id]);

        return response()->json(['data' => new KnowledgeDocResource($doc)]);
    }

    public function destroy(Request $request, string $docId): JsonResponse
    {
        $doc = KnowledgeDoc::where('doc_id', $docId)->first();
        if (! $doc) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $doc->delete();
        Audit::record('knowledge_doc.delete', ['user' => $request->user(), 'target' => $docId]);

        return response()->json(['data' => ['deleted' => $docId]]);
    }
}
