<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CostActivity;
use App\Models\NotificationItem;
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
                // Set once, on the first write — this is who a decision reports
                // back to, so an approver touching the row must not overwrite it.
                'created_by' => $before?->created_by ?? $request->user()?->id,
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
            $this->announce($activity, $before?->status, $request->user());
        } else {
            Audit::record('cost_activity.upsert', ['user' => $request->user(), 'target' => $activity->activity_id]);
        }

        return response()->json(['data' => $activity->toClient()]);
    }

    /** Activities waiting on a decision, newest first — the approval queue. */
    public function pending(): JsonResponse
    {
        $rows = CostActivity::whereIn('status', ['Waiting Approval', 'LPJ Review'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (CostActivity $a) => $a->toClient());

        return response()->json(['data' => $rows]);
    }

    /**
     * Tell the right person a status moved.
     *
     * Two directions only: a request for a decision goes to whoever can make it
     * (cost.manage), and the outcome goes back to whoever raised the activity.
     * Anything else would be noise. The actor is never notified of their own move.
     */
    private function announce(CostActivity $activity, ?string $from, ?\App\Models\User $actor): void
    {
        $ref = $activity->ref_no ?: $activity->activity_id;
        $label = "{$ref} · {$activity->nama}";
        $link = '/cost-optimization?activity='.$activity->activity_id;

        // Needs a decision → the people who can decide.
        $needsDecision = [
            'Waiting Approval' => "Proposal menunggu persetujuan: {$label}",
            'LPJ Review' => "LPJ menunggu verifikasi: {$label}",
        ];
        if (isset($needsDecision[$activity->status])) {
            NotificationItem::notify(
                \App\Models\User::withPermission('cost.manage'),
                $needsDecision[$activity->status],
                'approval',
                $link,
                $actor?->id
            );

            return;
        }

        // A decision was made → back to whoever raised it. Only meaningful when
        // the activity was actually awaiting one, so a plain Draft edit is silent.
        $wasAwaiting = in_array($from, ['Waiting Approval', 'LPJ Review'], true);
        $outcome = [
            'In Progress' => $from === 'LPJ Review' ? "LPJ dikembalikan untuk diperbaiki: {$label}" : "Proposal disetujui: {$label}",
            'Need Revision' => "Proposal perlu revisi: {$label}",
            'Rejected' => "Proposal ditolak: {$label}",
            'Closed' => "LPJ disetujui dan kegiatan ditutup: {$label}",
        ];
        if ($wasAwaiting && isset($outcome[$activity->status]) && $activity->created_by) {
            $submitter = \App\Models\User::find($activity->created_by);
            if ($submitter) {
                NotificationItem::notify([$submitter], $outcome[$activity->status], 'approval', $link, $actor?->id);
            }
        }
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
