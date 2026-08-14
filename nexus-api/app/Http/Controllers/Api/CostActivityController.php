<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CostActivity;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Cost Optimization — activity, proposal, realisasi and LPJ.
 *
 * Gated on cost.view / cost.manage: the module approves spending, so the right to
 * write here is deliberately separate from programs.manage. The page saves an
 * activity as one whole document, so the upsert takes the whole thing — that also
 * makes it idempotent, which matters because status changes and evidence ticks
 * fire the same save path.
 *
 * Status transitions are recorded in the audit log; the module's own governance
 * KPIs (approval timeliness, outstanding LPJ) are computed by the page from the
 * activity list.
 */
class CostActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CostActivity::query();
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        $rows = $query->orderByDesc('tanggal')->orderByDesc('id')->get()->map(fn (CostActivity $a) => $a->toClient());

        return response()->json(['data' => $rows]);
    }

    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:255'],
            'refNo' => ['nullable', 'string', 'max:64'],
            'nama' => ['required', 'string', 'max:255'],
            'jenis' => ['nullable', 'string', 'max:64'],
            'tujuan' => ['nullable', 'string'],
            'latarBelakang' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
            'tanggal' => ['nullable', 'date'],
            'lokasi' => ['nullable', 'string', 'max:255'],
            'penanggungJawab' => ['nullable', 'string', 'max:255'],
            'peserta' => ['nullable', 'string'],
            'budget' => ['nullable', 'array'],
            'travel' => ['nullable', 'array'],
            'attachments' => ['nullable', 'array'],
            'realizations' => ['nullable', 'array'],
            'evidence' => ['nullable', 'array'],
            'lpj' => ['nullable', 'array'],
            'status' => ['required', 'string', 'max:32'],
            'createdAt' => ['nullable', 'string', 'max:64'],
        ]);

        $before = CostActivity::where('activity_id', $data['id'])->first();

        $activity = CostActivity::updateOrCreate(
            ['activity_id' => $data['id']],
            [
                'ref_no' => $data['refNo'] ?? null,
                'nama' => $data['nama'],
                'jenis' => $data['jenis'] ?? null,
                'tujuan' => $data['tujuan'] ?? null,
                'latar_belakang' => $data['latarBelakang'] ?? null,
                'output' => $data['output'] ?? null,
                'tanggal' => $data['tanggal'] ?? null,
                'lokasi' => $data['lokasi'] ?? null,
                'penanggung_jawab' => $data['penanggungJawab'] ?? null,
                'peserta' => $data['peserta'] ?? null,
                'budget' => $data['budget'] ?? [],
                'travel' => $data['travel'] ?? null,
                'attachments' => $data['attachments'] ?? [],
                'realizations' => $data['realizations'] ?? [],
                'evidence' => $data['evidence'] ?? [],
                'lpj' => $data['lpj'] ?? [],
                'status' => $data['status'],
                'created_at_label' => $data['createdAt'] ?? $before?->created_at_label,
                'updated_by' => $request->user()?->id,
            ]
        );

        // A status change is the auditable event here — it is how a proposal gets
        // approved and how an LPJ gets closed.
        if ($before?->status !== $activity->status) {
            Audit::record('cost_activity.status', [
                'user' => $request->user(),
                'target' => $activity->activity_id,
                'meta' => ['from' => $before?->status, 'to' => $activity->status, 'ref' => $activity->ref_no],
            ]);
        } else {
            Audit::record('cost_activity.upsert', ['user' => $request->user(), 'target' => $activity->activity_id]);
        }

        return response()->json(['data' => $activity->toClient()]);
    }

    public function destroy(Request $request, string $activityId): JsonResponse
    {
        $activity = CostActivity::where('activity_id', $activityId)->first();
        if (! $activity) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $activity->delete();
        Audit::record('cost_activity.delete', ['user' => $request->user(), 'target' => $activityId]);

        return response()->json(['data' => ['deleted' => $activityId]]);
    }
}
