<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use App\Models\MeetingActionItem;
use App\Models\MeetingAgendaItem;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Meetings, their agenda and their action items.
 *
 * Writes are gated on meetings.view rather than a manage permission: the module
 * is ungated in the UI and no meetings.manage exists in the RBAC map, so every
 * role that can open the page can edit it — the same call made for Documents.
 * All three collections upsert by a client-owned id.
 */
class MeetingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => MeetingResource::collection(Meeting::orderBy('scheduled_at')->get())]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'time' => ['nullable', 'string', 'max:255'],
            'attendees' => ['nullable', 'integer', 'min:0'],
            'actionItems' => ['nullable', 'integer', 'min:0'],
        ]);

        $meeting = Meeting::updateOrCreate(
            ['meeting_id' => $data['id']],
            [
                'title' => $data['title'],
                'scheduled_label' => $data['time'] ?? null,
                'attendees' => $data['attendees'] ?? 0,
                'action_items' => $data['actionItems'] ?? 0,
            ]
        );

        Audit::record('meeting.upsert', ['user' => $request->user(), 'target' => $meeting->meeting_id, 'meta' => ['title' => $meeting->title]]);

        return response()->json(['data' => new MeetingResource($meeting)]);
    }

    public function destroy(Request $request, string $meetingId): JsonResponse
    {
        $meeting = Meeting::where('meeting_id', $meetingId)->first();
        if (! $meeting) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $meeting->delete();
        Audit::record('meeting.delete', ['user' => $request->user(), 'target' => $meetingId]);

        return response()->json(['data' => ['deleted' => $meetingId]]);
    }

    // ---- Agenda -----------------------------------------------------------

    public function agenda(): JsonResponse
    {
        return response()->json(['data' => MeetingAgendaItem::orderBy('position')->orderBy('id')->get()->map(fn (MeetingAgendaItem $a) => $a->toClient())]);
    }

    public function agendaUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'text' => ['required', 'string'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $item = MeetingAgendaItem::updateOrCreate(
            ['item_id' => $data['id']],
            ['text' => $data['text'], 'position' => $data['position'] ?? 0, 'updated_by' => $request->user()?->id]
        );

        return response()->json(['data' => $item->toClient()]);
    }

    public function agendaDestroy(Request $request, string $itemId): JsonResponse
    {
        MeetingAgendaItem::where('item_id', $itemId)->delete();

        return response()->json(['data' => ['deleted' => $itemId]]);
    }

    // ---- Action items -----------------------------------------------------

    public function actions(): JsonResponse
    {
        return response()->json(['data' => MeetingActionItem::orderBy('position')->orderBy('id')->get()->map(fn (MeetingActionItem $a) => $a->toClient())]);
    }

    public function actionUpsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'assignee' => ['nullable', 'string', 'max:255'],
            'text' => ['required', 'string'],
            'status' => ['required', 'in:Open,Done'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $item = MeetingActionItem::updateOrCreate(
            ['item_id' => $data['id']],
            [
                'assignee' => $data['assignee'] ?? null,
                'text' => $data['text'],
                'status' => $data['status'],
                'position' => $data['position'] ?? 0,
                'updated_by' => $request->user()?->id,
            ]
        );

        return response()->json(['data' => $item->toClient()]);
    }

    public function actionDestroy(Request $request, string $itemId): JsonResponse
    {
        MeetingActionItem::where('item_id', $itemId)->delete();

        return response()->json(['data' => ['deleted' => $itemId]]);
    }
}
