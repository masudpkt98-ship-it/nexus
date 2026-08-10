<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobProfile;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Job Profiles (Performance Dictionary) — role master used by mapping/cascade.
 * Global catalogue; performance.manage to write. Upsert keyed by the client id
 * (jp-…) so edits/deletes hit the right row.
 */
class JobProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = JobProfile::query();
        if ($lvl = $request->query('level')) {
            $query->where('level', $lvl);
        }
        if ($unit = $request->query('unit')) {
            $query->where('unit', $unit);
        }
        $rows = $query->orderBy('id')->get()->map(fn (JobProfile $p) => $p->toClient());

        return response()->json(['data' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'profile_id' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:64'],
            'unit' => ['nullable', 'string', 'max:255'],
            'purpose' => ['nullable', 'string'],
            'responsibilities' => ['nullable', 'array'],
            'responsibilities.*' => ['string', 'max:1000'],
            'kpi_ids' => ['nullable', 'array'],
            'kpi_ids.*' => ['string', 'max:255'],
        ]);

        $user = $request->user();
        $existing = JobProfile::where('profile_id', $data['profile_id'])->first();
        $row = JobProfile::updateOrCreate(
            ['profile_id' => $data['profile_id']],
            [
                'role' => $data['role'],
                'level' => $data['level'] ?? null,
                'unit' => $data['unit'] ?? null,
                'purpose' => $data['purpose'] ?? null,
                'responsibilities' => $data['responsibilities'] ?? [],
                'kpi_ids' => $data['kpi_ids'] ?? [],
                'created_by' => $existing->created_by ?? $user->id,
                'updated_by' => $user->id,
            ]
        );

        Audit::record('job_profile.upsert', ['user' => $user, 'target' => $row->profile_id]);

        return response()->json(['data' => $row->toClient()]);
    }

    public function destroy(Request $request, string $profileId): JsonResponse
    {
        $row = JobProfile::where('profile_id', $profileId)->first();
        if (! $row) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $row->delete();
        Audit::record('job_profile.delete', ['user' => $request->user(), 'target' => $profileId]);

        return response()->json(['data' => ['deleted' => $profileId]]);
    }
}
