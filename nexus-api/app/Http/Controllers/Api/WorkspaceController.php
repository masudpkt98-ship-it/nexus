<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\NotificationResource;
use App\Models\Activity;
use App\Models\NotificationItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    /**
     * The caller's notifications: those addressed to them, plus department-wide
     * announcements (user_id null), which is how every notification behaved
     * before approval routing started addressing people individually.
     */
    public function notifications(Request $request)
    {
        $query = NotificationItem::query()
            ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $request->user()?->id));

        if ($request->filled('channel') && $request->string('channel') !== 'All') {
            $query->where('channel', $request->string('channel'));
        }

        return NotificationResource::collection($query->orderByDesc('id')->get());
    }

    /** Marks only what the caller can actually see. */
    public function markAllRead(Request $request): JsonResponse
    {
        NotificationItem::where('read', false)
            ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $request->user()?->id))
            ->update(['read' => true]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function activities()
    {
        return ActivityResource::collection(Activity::orderByDesc('id')->limit(15)->get());
    }
}
