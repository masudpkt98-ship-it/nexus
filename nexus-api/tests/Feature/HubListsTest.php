<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Performance hub's top-performer ranking and the Development page's training
 * calendar — the last two surfaces that lived only in the browser.
 */
class HubListsTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGER = 'arif.wibowo@nexus.co';   // performance.manage + competency.manage

    private const STAFF = 'rani@nexus.co';            // view only

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    // ---- Top performers ---------------------------------------------------

    public function test_top_performer_round_trips_and_upserts_by_client_id(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/top-performers', [
            'id' => 'ap-9', 'name' => 'Rani Kusuma', 'avatar' => 'RK', 'role' => 'Analyst', 'score' => 88,
        ])->assertOk()->assertJsonPath('data.id', 'ap-9');

        $this->withHeaders($headers)->postJson('/api/top-performers', [
            'id' => 'ap-9', 'name' => 'Rani Kusuma', 'avatar' => 'RK', 'role' => 'Senior Analyst', 'score' => 94,
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/top-performers')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.role', 'Senior Analyst')
            ->assertJsonPath('data.0.score', 94);

        $this->withHeaders($headers)->deleteJson('/api/top-performers/ap-9')->assertOk();
        $this->withHeaders($headers)->getJson('/api/top-performers')->assertJsonCount(0, 'data');
    }

    public function test_top_performers_are_returned_ranked(): void
    {
        $headers = $this->authAs(self::MANAGER);

        foreach ([['ap-1', 70], ['ap-2', 95], ['ap-3', 82]] as [$id, $score]) {
            $this->withHeaders($headers)->postJson('/api/top-performers', [
                'id' => $id, 'name' => 'P '.$id, 'avatar' => 'PX', 'role' => 'Staff', 'score' => $score,
            ])->assertOk();
        }

        $scores = array_column($this->withHeaders($headers)->getJson('/api/top-performers')->json('data'), 'score');
        $this->assertSame([95, 82, 70], $scores);
    }

    public function test_top_performers_are_not_the_kpi_cascade_appraisals(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/top-performers', [
            'id' => 'ap-9', 'name' => 'Rani Kusuma', 'avatar' => 'RK', 'role' => 'Analyst', 'score' => 88,
        ])->assertOk();

        // The page caches these under a localStorage key called "appraisals"; the
        // two endpoints must stay entirely separate stores.
        $this->withHeaders($headers)->getJson('/api/appraisals')->assertOk()->assertJsonMissing(['name' => 'Rani Kusuma']);
    }

    public function test_staff_cannot_write_top_performers(): void
    {
        $this->withHeaders($this->authAs(self::STAFF))
            ->postJson('/api/top-performers', ['id' => 'ap-x', 'name' => 'X', 'score' => 10])
            ->assertStatus(403);
    }

    // ---- Training calendar ------------------------------------------------

    public function test_training_session_round_trips_with_its_display_labels(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/training-sessions', [
            'id' => 'ts-9', 'name' => 'Leadership Simulation Lab',
            'date' => 'Mon · Jul 13 · 09:00', 'seats' => '12 / 20', 'position' => 0,
        ])->assertOk();

        // date and seats are rendered verbatim — they must survive unparsed.
        $this->withHeaders($headers)->getJson('/api/training-sessions')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'ts-9')
            ->assertJsonPath('data.0.date', 'Mon · Jul 13 · 09:00')
            ->assertJsonPath('data.0.seats', '12 / 20');

        $this->withHeaders($headers)->deleteJson('/api/training-sessions/ts-9')->assertOk();
        $this->withHeaders($headers)->getJson('/api/training-sessions')->assertJsonCount(0, 'data');
    }

    public function test_training_sessions_keep_their_page_order(): void
    {
        $headers = $this->authAs(self::MANAGER);

        foreach ([['ts-3', 'Third', 2], ['ts-1', 'First', 0], ['ts-2', 'Second', 1]] as [$id, $name, $pos]) {
            $this->withHeaders($headers)->postJson('/api/training-sessions', [
                'id' => $id, 'name' => $name, 'date' => 'TBD', 'seats' => '0 / 0', 'position' => $pos,
            ])->assertOk();
        }

        $names = array_column($this->withHeaders($headers)->getJson('/api/training-sessions')->json('data'), 'name');
        $this->assertSame(['First', 'Second', 'Third'], $names);
    }

    public function test_staff_cannot_write_training_sessions(): void
    {
        $this->withHeaders($this->authAs(self::STAFF))
            ->postJson('/api/training-sessions', ['id' => 'ts-x', 'name' => 'X'])
            ->assertStatus(403);
    }
}
