<?php

namespace Tests\Feature;

use App\Models\Program;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Programs, Meetings, Satisfaction and Cost Optimization.
 *
 * The recurring defect across this app is a write that looks saved but never
 * comes back — a route bound to an id the client never sees, or a write route
 * that does not exist at all. Every case here asserts the round trip through the
 * endpoint the page actually loads from.
 */
class RemainingModulesTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGER = 'arif.wibowo@nexus.co';   // programs.manage + cost.manage

    private const STAFF = 'rani@nexus.co';            // neither

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    // ---- Programs ---------------------------------------------------------

    public function test_program_is_addressed_by_code_not_numeric_id(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $code = $this->withHeaders($headers)->postJson('/api/programs', [
            'name' => 'Digital Enablement', 'owner' => 'Arif Wibowo', 'status' => 'On Track',
            'progress' => 10, 'budget' => 500, 'spent' => 0, 'risk' => 'Low',
        ])->assertCreated()->json('data.id');

        // The id the client receives is the code (PRG-nn) — the update must accept it.
        $this->assertMatchesRegularExpression('/^PRG-\d+$/', $code);

        $this->withHeaders($headers)->putJson("/api/programs/{$code}", ['progress' => 55])
            ->assertOk()
            ->assertJsonPath('data.progress', 55);

        $this->withHeaders($headers)->deleteJson("/api/programs/{$code}")->assertOk();
    }

    public function test_program_persists_owner_name_and_goal_links(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $code = $this->withHeaders($headers)->postJson('/api/programs', [
            'name' => 'Competency Rollout', 'owner' => 'Sinta Larasati',
            'goalIds' => ['sg-1', 'sg-2'], 'okrIds' => ['okr-9'],
        ])->assertCreated()->json('data.id');

        // These had no columns before, so they vanished on the next load.
        $this->withHeaders($headers)->getJson("/api/programs/{$code}")
            ->assertJsonPath('data.owner', 'Sinta Larasati')
            ->assertJsonPath('data.goalIds', ['sg-1', 'sg-2'])
            ->assertJsonPath('data.okrIds', ['okr-9']);
    }

    public function test_milestones_round_trip_and_cascade_on_program_delete(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $code = Program::first()->code;

        $this->withHeaders($headers)->postJson('/api/program-milestones', [
            'milestone_id' => 'mst-900', 'program_code' => $code,
            'name' => 'Pilot cohort', 'due' => '2026-09-30', 'status' => 'In Progress', 'progress' => 45,
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/program-milestones?program='.urlencode($code))
            ->assertJsonPath('data.0.id', 'mst-900')
            ->assertJsonPath('data.0.programId', $code)
            ->assertJsonPath('data.0.progress', 45);

        $this->withHeaders($headers)->deleteJson("/api/programs/{$code}")->assertOk();
        $this->withHeaders($headers)->getJson('/api/program-milestones')->assertJsonCount(0, 'data');
    }

    public function test_staff_cannot_manage_programs(): void
    {
        $this->withHeaders($this->authAs(self::STAFF))
            ->postJson('/api/programs', ['name' => 'X'])
            ->assertStatus(403);
    }

    // ---- Meetings ---------------------------------------------------------

    public function test_meeting_write_routes_exist_and_round_trip(): void
    {
        $headers = $this->authAs(self::MANAGER);

        // These previously 404'd — only a GET route existed.
        $this->withHeaders($headers)->postJson('/api/meetings', [
            'id' => 'mtg-abc', 'title' => 'Budget Review', 'time' => 'Fri · 09:00',
            'attendees' => 6, 'actionItems' => 2,
        ])->assertOk()->assertJsonPath('data.id', 'mtg-abc');

        $this->withHeaders($headers)->postJson('/api/meetings', [
            'id' => 'mtg-abc', 'title' => 'Budget Review (rescheduled)', 'time' => 'Mon · 09:00',
            'attendees' => 7, 'actionItems' => 3,
        ])->assertOk();

        $rows = $this->withHeaders($headers)->getJson('/api/meetings')->json('data');
        $mine = collect($rows)->firstWhere('id', 'mtg-abc');
        $this->assertSame('Budget Review (rescheduled)', $mine['title']);
        $this->assertSame(7, $mine['attendees']);

        $this->withHeaders($headers)->deleteJson('/api/meetings/mtg-abc')->assertOk();
        $this->assertNotContains('mtg-abc', array_column($this->withHeaders($headers)->getJson('/api/meetings')->json('data'), 'id'));
    }

    public function test_seeded_meetings_expose_a_stable_client_id(): void
    {
        $rows = $this->withHeaders($this->authAs(self::MANAGER))->getJson('/api/meetings')->json('data');

        $this->assertNotEmpty($rows);
        foreach ($rows as $m) {
            $this->assertNotNull($m['id'] ?? null);
        }
    }

    public function test_agenda_and_action_items_round_trip(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/meeting-agenda', ['id' => 'ag-9', 'text' => 'Review Q3 KPI', 'position' => 0])->assertOk();
        $this->withHeaders($headers)->getJson('/api/meeting-agenda')
            ->assertJsonPath('data.0.id', 'ag-9')
            ->assertJsonPath('data.0.text', 'Review Q3 KPI');

        $this->withHeaders($headers)->postJson('/api/meeting-actions', [
            'id' => 'ac-9', 'assignee' => 'SL', 'text' => 'Finalize cascade', 'status' => 'Open',
        ])->assertOk();
        $this->withHeaders($headers)->postJson('/api/meeting-actions', [
            'id' => 'ac-9', 'assignee' => 'SL', 'text' => 'Finalize cascade', 'status' => 'Done',
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/meeting-actions')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'Done');

        $this->withHeaders($headers)->deleteJson('/api/meeting-agenda/ag-9')->assertOk();
        $this->withHeaders($headers)->getJson('/api/meeting-agenda')->assertJsonCount(0, 'data');
    }

    // ---- Satisfaction -----------------------------------------------------

    public function test_survey_rating_buckets_match_the_pages_own_bucketing(): void
    {
        $headers = $this->authAs(self::MANAGER);

        // The page buckets 5 = promoter, 4 = passive, <=3 = detractor. The server
        // stores rating x 2 on its 0-10 scale; these must agree.
        $before = $this->withHeaders($headers)->getJson('/api/satisfaction')->json('counts');

        foreach ([5, 5, 4, 3, 1] as $rating) {
            $this->withHeaders($headers)->postJson('/api/satisfaction/responses', ['rating' => $rating])->assertOk();
        }

        $after = $this->withHeaders($headers)->getJson('/api/satisfaction')->json('counts');

        $this->assertSame($before['promoters'] + 2, $after['promoters']);
        $this->assertSame($before['passives'] + 1, $after['passives']);
        $this->assertSame($before['detractors'] + 2, $after['detractors']);
    }

    public function test_satisfaction_service_round_trips_by_client_id(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/satisfaction/services', [
            'service_id' => 'svc-abc', 'service' => 'Payroll Support', 'score' => 4.2, 'position' => 9,
        ])->assertOk();

        $this->withHeaders($headers)->postJson('/api/satisfaction/services', [
            'service_id' => 'svc-abc', 'service' => 'Payroll Support', 'score' => 4.6, 'position' => 9,
        ])->assertOk();

        $services = $this->withHeaders($headers)->getJson('/api/satisfaction')->json('byService');
        $mine = collect($services)->where('id', 'svc-abc');
        $this->assertCount(1, $mine, 'the same client id must update in place');
        $this->assertSame(4.6, $mine->first()['score']);

        $this->withHeaders($headers)->deleteJson('/api/satisfaction/services/svc-abc')->assertOk();
    }

    public function test_seeded_services_expose_a_stable_client_id(): void
    {
        $services = $this->withHeaders($this->authAs(self::MANAGER))->getJson('/api/satisfaction')->json('byService');

        $this->assertNotEmpty($services);
        foreach ($services as $s) {
            $this->assertNotNull($s['id'] ?? null);
        }
    }

    // ---- Cost Optimization ------------------------------------------------

    private function activity(array $over = []): array
    {
        return array_merge([
            'id' => 'ACT-2026-900',
            'refNo' => 'ACT-2026-900',
            'nama' => 'Pelatihan Penyusunan KPI',
            'jenis' => 'Pelatihan',
            'tujuan' => 'Meningkatkan kemampuan penyusunan KPI.',
            'tanggal' => '2026-03-12',
            'lokasi' => 'Ruang Training Lt. 3',
            'penanggungJawab' => 'AVP People Development',
            'budget' => [['component' => 'Konsumsi', 'qty' => 20, 'price' => 75000]],
            'travel' => null,
            'attachments' => ['TOR', 'Jadwal'],
            'realizations' => [['id' => 'r1', 'tanggal' => '2026-03-12', 'nomorBukti' => 'INV-1', 'vendor' => 'Katering', 'component' => 'Konsumsi', 'nominal' => 1500000, 'metode' => 'Transfer']],
            'evidence' => ['admin:Proposal', 'finance:Invoice'],
            'lpj' => ['tujuan' => 'Tercapai', 'hasil' => '20 peserta lulus'],
            'status' => 'Draft',
            'createdAt' => '2026-03-01T00:00:00Z',
        ], $over);
    }

    public function test_cost_activity_round_trips_with_its_nested_document(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity())->assertOk();

        $this->withHeaders($headers)->getJson('/api/cost-activities')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'ACT-2026-900')
            ->assertJsonPath('data.0.budget.0.price', 75000)
            ->assertJsonPath('data.0.realizations.0.vendor', 'Katering')
            ->assertJsonPath('data.0.evidence', ['admin:Proposal', 'finance:Invoice'])
            ->assertJsonPath('data.0.lpj.hasil', '20 peserta lulus')
            ->assertJsonPath('data.0.createdAt', '2026-03-01T00:00:00Z');
    }

    public function test_cost_activity_upsert_is_idempotent_on_the_client_id(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity())->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['status' => 'Closed']))->assertOk();

        $this->withHeaders($headers)->getJson('/api/cost-activities')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'Closed');
    }

    public function test_status_change_is_audited(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity())->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity(['status' => 'Waiting Approval']))->assertOk();

        // Approving spending must leave a trail.
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'cost_activity.status',
            'target' => 'ACT-2026-900',
        ]);
    }

    public function test_cost_writes_need_cost_manage(): void
    {
        // Staff has neither cost.view nor cost.manage.
        $this->withHeaders($this->authAs(self::STAFF))
            ->postJson('/api/cost-activities', $this->activity())
            ->assertStatus(403);
    }

    public function test_supervisor_can_read_but_not_write_cost_activities(): void
    {
        // The separation of duty the cost.* split exists for.
        $headers = $this->authAs('dimas@nexus.co'); // Supervisor: cost.view only

        $this->withHeaders($headers)->getJson('/api/cost-activities')->assertOk();
        $this->withHeaders($headers)->postJson('/api/cost-activities', $this->activity())->assertStatus(403);
    }
}
