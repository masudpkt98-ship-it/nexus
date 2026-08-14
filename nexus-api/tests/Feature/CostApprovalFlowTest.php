<?php

namespace Tests\Feature;

use App\Models\NotificationItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Cost Optimization approval routing.
 *
 * The module already had a lifecycle and a cost.manage split; what it lacked was
 * anyone being told. These cases pin down who hears about what: a request for a
 * decision reaches the people who can make it, the outcome reaches whoever raised
 * the activity, and neither reaches anybody else.
 */
class CostApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    private const APPROVER = 'arif.wibowo@nexus.co';   // VP — cost.manage

    private const OTHER_APPROVER = 'sinta@nexus.co';   // Manager — cost.manage

    private const VIEWER = 'dimas@nexus.co';           // Supervisor — cost.view only

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function activity(array $over = []): array
    {
        return array_merge([
            'id' => 'ACT-2026-500',
            'refNo' => 'ACT-2026-500',
            'nama' => 'Pelatihan Penyusunan KPI',
            'jenis' => 'Pelatihan',
            'status' => 'Draft',
        ], $over);
    }

    /** Titles of the notifications addressed to one user. */
    private function inboxOf(string $email): array
    {
        $user = User::where('email', $email)->firstOrFail();

        return NotificationItem::where('user_id', $user->id)->pluck('title')->all();
    }

    public function test_submitting_notifies_everyone_who_can_approve(): void
    {
        $headers = $this->authAs(self::APPROVER);

        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity())->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['status' => 'Waiting Approval']))->assertOk();

        // The other approver is told; the submitter is not told about their own move.
        $this->assertNotEmpty(preg_grep('/menunggu persetujuan/i', $this->inboxOf(self::OTHER_APPROVER)));
        $this->assertEmpty(preg_grep('/menunggu persetujuan/i', $this->inboxOf(self::APPROVER)));

        // Someone with only cost.view has no say, so is not asked.
        $this->assertEmpty($this->inboxOf(self::VIEWER));
    }

    public function test_decision_goes_back_to_whoever_raised_the_activity(): void
    {
        // Raised by the VP…
        $this->withHeaders($this->authAs(self::APPROVER))
            ->postJson('/api/cost-activities', $this->activity(['status' => 'Waiting Approval']))->assertOk();

        // …and decided by the Manager.
        $this->withHeaders($this->authAs(self::OTHER_APPROVER))
            ->postJson('/api/cost-activities', $this->activity(['status' => 'In Progress']))->assertOk();

        $this->assertNotEmpty(preg_grep('/disetujui/i', $this->inboxOf(self::APPROVER)));
    }

    public function test_rejection_and_revision_reach_the_submitter(): void
    {
        // authAs() must be called immediately before each request — it resets the
        // auth guard, so reusing headers captured earlier would keep acting as
        // whoever the previous request resolved.
        $this->withHeaders($this->authAs(self::APPROVER))->postJson('/api/cost-activities', $this->activity(['status' => 'Waiting Approval']))->assertOk();
        $this->withHeaders($this->authAs(self::OTHER_APPROVER))->postJson('/api/cost-activities', $this->activity(['status' => 'Need Revision']))->assertOk();
        $this->assertNotEmpty(preg_grep('/perlu revisi/i', $this->inboxOf(self::APPROVER)));

        $this->withHeaders($this->authAs(self::APPROVER))->postJson('/api/cost-activities', $this->activity(['status' => 'Waiting Approval']))->assertOk();
        $this->withHeaders($this->authAs(self::OTHER_APPROVER))->postJson('/api/cost-activities', $this->activity(['status' => 'Rejected']))->assertOk();
        $this->assertNotEmpty(preg_grep('/ditolak/i', $this->inboxOf(self::APPROVER)));
    }

    public function test_lpj_review_then_close_notifies_at_each_step(): void
    {
        $this->withHeaders($this->authAs(self::APPROVER))->postJson('/api/cost-activities', $this->activity(['status' => 'In Progress']))->assertOk();
        $this->withHeaders($this->authAs(self::APPROVER))->postJson('/api/cost-activities', $this->activity(['status' => 'LPJ Review']))->assertOk();
        $this->assertNotEmpty(preg_grep('/LPJ menunggu verifikasi/i', $this->inboxOf(self::OTHER_APPROVER)));

        $this->withHeaders($this->authAs(self::OTHER_APPROVER))->postJson('/api/cost-activities', $this->activity(['status' => 'Closed']))->assertOk();
        $this->assertNotEmpty(preg_grep('/ditutup/i', $this->inboxOf(self::APPROVER)));
    }

    public function test_editing_without_a_status_change_notifies_nobody(): void
    {
        $headers = $this->authAs(self::APPROVER);

        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity())->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['nama' => 'Judul diperbarui']))->assertOk();

        // A plain Draft edit is not news. Scoped to this activity, because the
        // seeder already ships unrelated 'approval' notifications.
        $this->assertSame(0, NotificationItem::where('link', 'like', '%ACT-2026-500%')->count());
    }

    public function test_notification_carries_a_link_to_the_activity(): void
    {
        $this->withHeaders($this->authAs(self::APPROVER))
            ->postJson('/api/cost-activities', $this->activity(['status' => 'Waiting Approval']))->assertOk();

        // whereNotNull skips the seeder's linkless notifications.
        $link = NotificationItem::whereNotNull('link')->value('link');
        $this->assertSame('/cost-optimization?activity=ACT-2026-500', $link);
    }

    public function test_each_user_only_sees_their_own_notifications(): void
    {
        $this->withHeaders($this->authAs(self::APPROVER))
            ->postJson('/api/cost-activities', $this->activity(['status' => 'Waiting Approval']))->assertOk();

        // Addressed to the Manager…
        $titles = array_column($this->withHeaders($this->authAs(self::OTHER_APPROVER))->getJson('/api/notifications')->json('data'), 'title');
        $this->assertNotEmpty(preg_grep('/menunggu persetujuan/i', $titles));

        // …and not visible to a viewer, even though department-wide ones still are.
        $viewerTitles = array_column($this->withHeaders($this->authAs(self::VIEWER))->getJson('/api/notifications')->json('data'), 'title');
        $this->assertEmpty(preg_grep('/menunggu persetujuan/i', $viewerTitles));
    }

    public function test_queue_lists_only_what_awaits_a_decision(): void
    {
        $headers = $this->authAs(self::APPROVER);

        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['id' => 'A-1', 'refNo' => 'A-1', 'status' => 'Waiting Approval']))->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['id' => 'A-2', 'refNo' => 'A-2', 'status' => 'LPJ Review']))->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['id' => 'A-3', 'refNo' => 'A-3', 'status' => 'Draft']))->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['id' => 'A-4', 'refNo' => 'A-4', 'status' => 'Closed']))->assertOk();

        $ids = array_column($this->withHeaders($headers)->getJson('/api/cost-activities/pending')->json('data'), 'id');
        sort($ids);
        $this->assertSame(['A-1', 'A-2'], $ids);
    }

    public function test_queue_requires_cost_manage(): void
    {
        $this->withHeaders($this->authAs(self::VIEWER))->getJson('/api/cost-activities/pending')->assertStatus(403);
    }
}
