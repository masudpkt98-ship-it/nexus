<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The competency suite's persistence: Kamus Kompetensi, the Matrix, the COMPASS
 * surfaces and development plans. Each case asserts the round trip — write, then
 * read back through the endpoint the page actually loads from — because the bug
 * these tables replace was data that looked saved but never came back.
 */
class CompetencySuiteTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGER = 'arif.wibowo@nexus.co';   // has competency.manage

    private const STAFF = 'rani@nexus.co';            // view only

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function comp(array $over = []): array
    {
        return array_merge([
            'comp_id' => 'tc-001',
            'code' => 'TC-001',
            'name' => 'Analisis Data',
            'category' => 'Kompetensi Teknis',
            'definition' => 'Mengolah dan menafsirkan data.',
            'indicators' => [['level' => 1, 'indicator' => 'Memahami dasar']],
        ], $over);
    }

    // ---- Kamus Kompetensi -------------------------------------------------

    public function test_dictionary_competency_round_trips(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/competency-dictionary', $this->comp())->assertOk();

        $this->withHeaders($headers)->getJson('/api/competency-dictionary')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'tc-001')
            ->assertJsonPath('data.0.name', 'Analisis Data')
            ->assertJsonPath('data.0.indicators.0.indicator', 'Memahami dasar');
    }

    public function test_dictionary_upsert_is_keyed_by_client_id(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/competency-dictionary', $this->comp())->assertOk();
        $this->withHeaders($headers)->postJson('/api/competency-dictionary', $this->comp(['name' => 'Analisis Data Lanjutan']))->assertOk();

        // Same client id must update in place, never create a second row.
        $this->withHeaders($headers)->getJson('/api/competency-dictionary')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Analisis Data Lanjutan');
    }

    public function test_bulk_import_replaces_only_the_named_category(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/competency-dictionary', $this->comp())->assertOk();
        $this->withHeaders($headers)->postJson('/api/competency-dictionary', $this->comp([
            'comp_id' => 'bh-001', 'code' => 'BH-001', 'name' => 'Integritas', 'category' => 'Perilaku',
        ]))->assertOk();

        $this->withHeaders($headers)->putJson('/api/competency-dictionary/bulk', [
            'category' => 'Kompetensi Teknis',
            'items' => [$this->comp(['comp_id' => 'tc-900', 'code' => 'TC-900', 'name' => 'Keamanan Siber'])],
        ])->assertOk();

        $all = $this->withHeaders($headers)->getJson('/api/competency-dictionary')->json('data');
        $ids = array_column($all, 'id');

        sort($ids);
        // The imported category is swapped wholesale; Perilaku is untouched.
        $this->assertSame(['bh-001', 'tc-900'], $ids);
    }

    public function test_staff_cannot_write_the_dictionary(): void
    {
        $this->withHeaders($this->authAs(self::STAFF))
            ->postJson('/api/competency-dictionary', $this->comp())
            ->assertStatus(403);
    }

    public function test_levels_replace_drops_levels_not_sent(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->putJson('/api/competency-levels', ['levels' => [
            ['level' => 1, 'name' => 'Knowledgeable', 'description' => 'Dasar'],
            ['level' => 2, 'name' => 'Basic Practitioner', 'description' => 'Rutin'],
        ]])->assertOk();

        $this->withHeaders($headers)->putJson('/api/competency-levels', ['levels' => [
            ['level' => 1, 'name' => 'Paham', 'description' => 'Dasar'],
        ]])->assertOk();

        $this->withHeaders($headers)->getJson('/api/competency-levels')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Paham');
    }

    // ---- Competency Matrix ------------------------------------------------

    public function test_matrix_standards_and_assessments_round_trip(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $group = 'Teknologi Informasi';

        $this->withHeaders($headers)->postJson('/api/competency-standards', [
            'group_key' => $group, 'comp_id' => 'tc-001', 'required_level' => 4,
        ])->assertOk();

        $this->withHeaders($headers)->postJson('/api/competency-assessments', [
            'group_key' => $group, 'npk' => '4234747', 'name' => 'Kharisma', 'levels' => ['tc-001' => 3],
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/competency-matrix')
            ->assertOk()
            ->assertJsonPath("data.standards.{$group}.tc-001", 4)
            ->assertJsonPath("data.assessments.{$group}.0.npk", '4234747')
            ->assertJsonPath("data.assessments.{$group}.0.levels.tc-001", 3);
    }

    public function test_assessment_upsert_replaces_the_whole_level_map(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $group = 'Teknologi Informasi';

        $this->withHeaders($headers)->postJson('/api/competency-assessments', [
            'group_key' => $group, 'npk' => '4234747', 'name' => 'Kharisma', 'levels' => ['tc-001' => 3],
        ])->assertOk();
        $this->withHeaders($headers)->postJson('/api/competency-assessments', [
            'group_key' => $group, 'npk' => '4234747', 'name' => 'Kharisma', 'levels' => ['tc-001' => 5, 'tc-002' => 2],
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/competency-matrix')
            ->assertJsonCount(1, "data.assessments.{$group}")
            ->assertJsonPath("data.assessments.{$group}.0.levels.tc-001", 5)
            ->assertJsonPath("data.assessments.{$group}.0.levels.tc-002", 2);
    }

    public function test_assessment_delete_takes_group_and_npk_as_query(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $group = 'Job Family / Umum';   // spaces and a slash — must survive the query string

        $this->withHeaders($headers)->postJson('/api/competency-assessments', [
            'group_key' => $group, 'npk' => '4234747', 'name' => 'Kharisma', 'levels' => [],
        ])->assertOk();

        $this->withHeaders($headers)
            ->deleteJson('/api/competency-assessments?'.http_build_query(['group_key' => $group, 'npk' => '4234747']))
            ->assertOk();

        $this->withHeaders($headers)->getJson('/api/competency-matrix')
            ->assertJsonPath('data.assessments', []);
    }

    // ---- COMPASS ----------------------------------------------------------

    public function test_current_levels_round_trip_as_a_flat_map(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/competency-current-levels', [
            'npk' => '4234747', 'comp_code' => 'TC-001', 'level' => 3,
        ])->assertOk();

        // The Gap Analysis page reads this as `npk|code` → level.
        $this->withHeaders($headers)->getJson('/api/competency-current-levels')
            ->assertOk()
            ->assertJsonPath('data.4234747|TC-001', 3);
    }

    public function test_job_descriptions_save_as_a_batch(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->putJson('/api/job-descriptions', ['items' => [
            [
                'desc_key' => 'vpkompetensi',
                'jabatan_name' => 'VP Kompetensi',
                'purpose' => 'Memimpin pengembangan kompetensi.',
                'responsibilities' => [['text' => 'Menyusun kamus', 'kpis' => []]],
            ],
            ['desc_key' => 'avpkinerja', 'jabatan_name' => 'AVP Kinerja', 'purpose' => 'Mengelola KPI.'],
        ]])->assertOk();

        $this->withHeaders($headers)->getJson('/api/job-descriptions')
            ->assertOk()
            ->assertJsonPath('data.vpkompetensi.jabatanName', 'VP Kompetensi')
            ->assertJsonPath('data.vpkompetensi.responsibilities.0.text', 'Menyusun kamus')
            ->assertJsonPath('data.avpkinerja.purpose', 'Mengelola KPI.');
    }

    public function test_ojt_status_round_trips(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $item = [
            'item_id' => 'ojt-1', 'employee' => 'Rani Kusuma', 'role' => 'Analyst',
            'kind' => 'OJT', 'activity' => 'Shadow audit', 'mentor' => 'Sinta', 'status' => 'Belum',
        ];

        $this->withHeaders($headers)->postJson('/api/ojt-items', $item)->assertOk();
        $this->withHeaders($headers)->postJson('/api/ojt-items', ['status' => 'Selesai'] + $item)->assertOk();

        $this->withHeaders($headers)->getJson('/api/ojt-items')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', 'ojt-1')
            ->assertJsonPath('data.0.status', 'Selesai');
    }

    // ---- Development plans ------------------------------------------------

    public function test_development_plan_round_trips_by_client_id(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/development-plans', [
            'plan_id' => 'dp-abc123', 'employee' => 'Rani Kusuma', 'avatar' => 'RK',
            'role' => 'Analyst', 'readiness' => 74, 'gaps' => 2, 'nextStep' => 'Advanced Analytics',
        ])->assertOk()->assertJsonPath('data.id', 'dp-abc123');

        $plans = $this->withHeaders($headers)->getJson('/api/competency')->json('developmentPlans');
        $this->assertContains('dp-abc123', array_column($plans, 'id'));

        $this->withHeaders($headers)->deleteJson('/api/development-plans/dp-abc123')->assertOk();

        $plans = $this->withHeaders($headers)->getJson('/api/competency')->json('developmentPlans');
        $this->assertNotContains('dp-abc123', array_column($plans, 'id'));
    }

    public function test_seeded_development_plans_expose_a_stable_id(): void
    {
        // The migration backfills `dp-{id}`; without an id the hub used to invent a
        // positional one per load, so edits could land on the wrong row.
        $plans = $this->withHeaders($this->authAs(self::MANAGER))->getJson('/api/competency')->json('developmentPlans');

        $this->assertNotEmpty($plans);
        foreach ($plans as $p) {
            $this->assertNotNull($p['id'] ?? null);
        }
    }

    public function test_staff_cannot_write_development_plans(): void
    {
        $this->withHeaders($this->authAs(self::STAFF))
            ->postJson('/api/development-plans', [
                'plan_id' => 'dp-x', 'employee' => 'X', 'readiness' => 1, 'gaps' => 0,
            ])->assertStatus(403);
    }
}
