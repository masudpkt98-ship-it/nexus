<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The five COMPASS tracking modules that became editable: LMS, Learning Journey,
 * Mentoring, Certification and Assessment.
 *
 * Each asserts the round trip through the endpoint its page loads from, since a
 * write that never comes back is the failure mode this whole area has had.
 */
class CompassTrackingTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGER = 'arif.wibowo@nexus.co';   // competency.manage

    private const STAFF = 'rani@nexus.co';            // competency.view only

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_lms_module_round_trips_and_upserts_by_client_id(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $body = ['id' => 'lms-1', 'title' => 'Dasar Analisis Data', 'competency' => 'Data Analysis', 'type' => 'Video', 'duration' => '15 menit', 'level' => 2];

        $this->withHeaders($headers)->postJson('/api/lms-modules', $body)->assertOk()->assertJsonPath('data.id', 'lms-1');
        $this->withHeaders($headers)->postJson('/api/lms-modules', ['level' => 4] + $body)->assertOk();

        $this->withHeaders($headers)->getJson('/api/lms-modules')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.level', 4)
            ->assertJsonPath('data.0.duration', '15 menit');

        $this->withHeaders($headers)->deleteJson('/api/lms-modules/lms-1')->assertOk();
        $this->withHeaders($headers)->getJson('/api/lms-modules')->assertJsonCount(0, 'data');
    }

    public function test_journey_round_trips_with_its_nested_weeks(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/learning-journeys', [
            'id' => 'jr-1',
            'employee' => 'Rani Kusuma',
            'role' => 'Competency Analyst',
            'progress' => 40,
            'weeks' => [
                ['week' => 1, 'items' => ['Orientasi K3', 'Pengenalan SOP unit']],
                ['week' => 2, 'items' => ['Praktik operasi mesin']],
            ],
        ])->assertOk();

        // The nested shape is what makes this one different — it must survive intact.
        $this->withHeaders($headers)->getJson('/api/learning-journeys')
            ->assertOk()
            ->assertJsonPath('data.0.weeks.0.week', 1)
            ->assertJsonPath('data.0.weeks.0.items', ['Orientasi K3', 'Pengenalan SOP unit'])
            ->assertJsonPath('data.0.weeks.1.items', ['Praktik operasi mesin'])
            ->assertJsonPath('data.0.progress', 40);
    }

    public function test_journey_weeks_are_replaced_wholesale_on_edit(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $base = ['id' => 'jr-1', 'employee' => 'Rani Kusuma', 'progress' => 10];

        $this->withHeaders($headers)->postJson('/api/learning-journeys', $base + [
            'weeks' => [['week' => 1, 'items' => ['A']], ['week' => 2, 'items' => ['B']]],
        ])->assertOk();

        // Removing a week in the editor must not leave the old one behind.
        $this->withHeaders($headers)->postJson('/api/learning-journeys', $base + [
            'weeks' => [['week' => 1, 'items' => ['A revised']]],
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/learning-journeys')
            ->assertJsonCount(1, 'data.0.weeks')
            ->assertJsonPath('data.0.weeks.0.items', ['A revised']);
    }

    public function test_mentoring_session_round_trips_including_action_plan(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/mentoring-sessions', [
            'id' => 'mt-1', 'employee' => 'Rani Kusuma', 'mentor' => 'Sinta L.', 'kind' => 'Coaching',
            'topic' => 'Analisis akar masalah', 'notes' => 'Diskusi 5 Why', 'actionPlan' => 'Latihan 2 kasus',
            'date' => '2026-08-14',
        ])->assertOk();

        // actionPlan is the one camelCase field that maps to a snake_case column.
        $this->withHeaders($headers)->getJson('/api/mentoring-sessions')
            ->assertJsonPath('data.0.actionPlan', 'Latihan 2 kasus')
            ->assertJsonPath('data.0.kind', 'Coaching')
            ->assertJsonPath('data.0.date', '2026-08-14');
    }

    public function test_certification_keeps_an_optional_expiry(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/certifications', [
            'id' => 'cert-1', 'employee' => 'Rani Kusuma', 'title' => 'Operator Ammonia Level 2',
            'level' => 'Level 2', 'status' => 'In Progress', 'issued' => '2026-08-01',
        ])->assertOk();

        // An in-progress certification has no expiry — null must round-trip as null.
        $this->withHeaders($headers)->getJson('/api/certifications')
            ->assertJsonPath('data.0.expires', null)
            ->assertJsonPath('data.0.issued', '2026-08-01');
    }

    public function test_assessment_score_distinguishes_ungraded_from_zero(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $base = ['id' => 'as-1', 'employee' => 'Rani Kusuma', 'competency' => 'Data Analysis', 'method' => 'Quiz', 'assessor' => 'Sinta L.'];

        $this->withHeaders($headers)->postJson('/api/assessment-records', $base + ['status' => 'Dijadwalkan'])->assertOk();
        $this->withHeaders($headers)->getJson('/api/assessment-records')->assertJsonPath('data.0.score', null);

        $this->withHeaders($headers)->postJson('/api/assessment-records', $base + ['status' => 'Dinilai', 'score' => 0])->assertOk();
        $this->withHeaders($headers)->getJson('/api/assessment-records')->assertJsonPath('data.0.score', 0);
    }

    public function test_view_only_role_can_read_but_not_write(): void
    {
        $headers = $this->authAs(self::STAFF);

        $this->withHeaders($headers)->getJson('/api/lms-modules')->assertOk();
        $this->withHeaders($headers)->postJson('/api/lms-modules', [
            'id' => 'lms-x', 'title' => 'X', 'type' => 'Video', 'level' => 1,
        ])->assertStatus(403);
        $this->withHeaders($headers)->deleteJson('/api/certifications/cert-x')->assertStatus(403);
    }

    public function test_deleting_an_unknown_record_is_404(): void
    {
        $this->withHeaders($this->authAs(self::MANAGER))
            ->deleteJson('/api/mentoring-sessions/does-not-exist')
            ->assertStatus(404);
    }
}
