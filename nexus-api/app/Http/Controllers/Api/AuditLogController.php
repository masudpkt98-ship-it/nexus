<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read the audit trail (admin only, permission:audit.view). Newest first, with
 * simple action/user filters and a bounded page size.
 */
class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->orderByDesc('id');

        if ($action = $request->query('action')) {
            $query->where('action', 'like', $action.'%');
        }
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($request->boolean('denied')) {
            $query->whereIn('action', ['access.denied', 'scope.denied']);
        }

        $limit = min(500, max(1, (int) $request->query('limit', 200)));
        $rows = $query->limit($limit)->get();

        return response()->json(['data' => $rows]);
    }
}
