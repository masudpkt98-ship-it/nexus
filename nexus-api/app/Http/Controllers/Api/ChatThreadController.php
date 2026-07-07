<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatThread;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatThreadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            ChatThread::where('user_id', $request->user()->id)
                ->with('latestMessage')
                ->orderByDesc('updated_at')
                ->get()
                ->map(fn ($t) => $this->present($t))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $thread = ChatThread::create([
            'user_id' => $request->user()->id,
            'title' => 'New chat',
        ]);

        return response()->json($this->present($thread), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['title' => ['required', 'string', 'max:120']]);
        $thread = ChatThread::where('user_id', $request->user()->id)->findOrFail($id);
        $thread->update(['title' => $data['title']]);

        return response()->json($this->present($thread));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        ChatThread::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->json(['message' => 'Conversation deleted.']);
    }

    public function messages(Request $request, int $id): JsonResponse
    {
        $thread = ChatThread::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json(
            $thread->messages()->orderBy('id')->get()
                ->map(fn ($m) => ['role' => $m->role, 'text' => $m->text, 'source' => $m->source])
        );
    }

    private function present(ChatThread $t): array
    {
        $last = $t->relationLoaded('latestMessage') ? $t->latestMessage : null;

        return [
            'id' => $t->id,
            'title' => $t->title,
            'preview' => $last ? \Illuminate\Support\Str::limit($last->text, 80) : null,
            'updatedAt' => optional($t->updated_at)->toIso8601String(),
        ];
    }
}
