<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\KnowledgeDocResource;
use App\Http\Resources\MeetingResource;
use App\Http\Resources\NotificationResource;
use App\Models\Activity;
use App\Models\KnowledgeDoc;
use App\Models\Meeting;
use App\Models\NotificationItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function meetings()
    {
        return MeetingResource::collection(Meeting::orderBy('scheduled_at')->get());
    }

    public function knowledge(Request $request)
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

    public function notifications(Request $request)
    {
        $query = NotificationItem::query();

        if ($request->filled('channel') && $request->string('channel') !== 'All') {
            $query->where('channel', $request->string('channel'));
        }

        return NotificationResource::collection($query->orderByDesc('id')->get());
    }

    public function markAllRead(): JsonResponse
    {
        NotificationItem::where('read', false)->update(['read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function activities()
    {
        return ActivityResource::collection(Activity::orderByDesc('id')->limit(15)->get());
    }
}
