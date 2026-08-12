<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Document Management — global document catalogue (upload/version/approval).
 * Keyed by the client doc_id so the existing client sync works unchanged:
 * POST sends the whole DocItem (create/upsert), PUT sends a partial patch,
 * DELETE removes by id. Gated on knowledge.view (the Workspace read permission
 * every role holds; the module is otherwise ungated in the UI).
 */
class DocumentController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = Document::orderByDesc('id')->get()->map(fn (Document $d) => $d->toClient());

        return response()->json(['data' => $rows]);
    }

    /** Create/replace a document (POST the whole DocItem, keyed by its id). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:32'],
            'folder' => ['nullable', 'string', 'max:64'],
            'owner' => ['nullable', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:32'],
            'approval' => ['nullable', 'in:Approved,Pending,Rejected'],
            'signed' => ['nullable', 'boolean'],
            'updated' => ['nullable', 'date'],
        ]);

        $user = $request->user();
        $existing = Document::where('doc_id', $data['id'])->first();
        $doc = Document::updateOrCreate(
            ['doc_id' => $data['id']],
            [
                'title' => $data['title'],
                'type' => $data['type'] ?? null,
                'folder' => $data['folder'] ?? null,
                'owner' => $data['owner'] ?? null,
                'version' => $data['version'] ?? null,
                'approval' => $data['approval'] ?? 'Pending',
                'signed' => $data['signed'] ?? false,
                'updated' => $data['updated'] ?? null,
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        Audit::record('document.upsert', ['user' => $user, 'target' => $doc->doc_id]);

        return response()->json(['data' => $doc->toClient()], $existing ? 200 : 201);
    }

    /** Patch a document — only the provided fields are changed. */
    public function update(Request $request, string $docId): JsonResponse
    {
        $doc = Document::where('doc_id', $docId)->first();
        if (! $doc) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'nullable', 'string', 'max:32'],
            'folder' => ['sometimes', 'nullable', 'string', 'max:64'],
            'owner' => ['sometimes', 'nullable', 'string', 'max:255'],
            'version' => ['sometimes', 'nullable', 'string', 'max:32'],
            'approval' => ['sometimes', 'in:Approved,Pending,Rejected'],
            'signed' => ['sometimes', 'boolean'],
            'updated' => ['sometimes', 'nullable', 'date'],
        ]);

        $doc->update($data + ['updated_by' => $request->user()->id]);

        return response()->json(['data' => $doc->fresh()->toClient()]);
    }

    public function destroy(Request $request, string $docId): JsonResponse
    {
        Document::where('doc_id', $docId)->delete();
        Audit::record('document.delete', ['user' => $request->user(), 'target' => $docId]);

        return response()->json(['data' => ['deleted' => $docId]]);
    }
}
