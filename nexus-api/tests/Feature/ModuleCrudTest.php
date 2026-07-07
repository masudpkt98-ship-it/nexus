<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_vp_can_create_a_competency(): void
    {
        $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))
            ->postJson('/api/competency', ['name' => 'Cloud Architecture', 'category' => 'Technical', 'current' => 2, 'required' => 4])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Cloud Architecture')
            ->assertJsonPath('data.current', 2);
    }

    public function test_staff_cannot_manage_competency(): void
    {
        $this->withHeaders($this->authAs('rani@nexus.co'))
            ->postJson('/api/competency', ['name' => 'X', 'category' => 'Y', 'current' => 1, 'required' => 2])
            ->assertStatus(403);
    }

    public function test_competency_validation_rejects_out_of_range_level(): void
    {
        $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))
            ->postJson('/api/competency', ['name' => 'X', 'category' => 'Y', 'current' => 9, 'required' => 2])
            ->assertStatus(422);
    }

    public function test_vp_can_create_and_delete_a_kpi(): void
    {
        $headers = $this->authAs('arif.wibowo@nexus.co');

        $code = $this->withHeaders($headers)
            ->postJson('/api/performance-kpis', ['name' => 'Revenue', 'level' => 'Corporate', 'weight' => 20, 'target' => 100, 'actual' => 80, 'unit' => '%'])
            ->assertCreated()
            ->json('data.id');

        $this->withHeaders($headers)->deleteJson("/api/performance-kpis/{$code}")->assertOk();
    }

    public function test_vp_can_create_an_objective_owned_by_creator(): void
    {
        $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))
            ->postJson('/api/objectives', ['title' => 'Launch Marketplace', 'quarter' => 'Q3', 'progress' => 20])
            ->assertCreated()
            ->assertJsonPath('data.owner', 'Arif Wibowo')
            ->assertJsonPath('data.quarter', 'Q3');
    }
}
