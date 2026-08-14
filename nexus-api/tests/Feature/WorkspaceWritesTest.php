<?php

namespace Tests\Feature;

use App\Models\ServiceRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Knowledge base and Service Requests — both looked wired and both dropped writes.
 *
 * Knowledge had no write routes at all, and Service Requests bound its update by
 * the numeric id while the client only ever saw the code. These cases pin the
 * addressing down: every write is made with the id the API itself handed back.
 */
class WorkspaceWritesTest extends TestCase
{
    use RefreshDatabase;

    private const MANAGER = 'arif.wibowo@nexus.co';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    // ---- Knowledge base ---------------------------------------------------

    public function test_knowledge_doc_round_trips_by_client_id(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/knowledge-docs', [
            'id' => 'kd-abc', 'title' => 'Onboarding SOP', 'category' => 'People',
            'version' => 'v1.0', 'type' => 'SOP', 'updated' => '2026-08-14',
        ])->assertOk()->assertJsonPath('data.id', 'kd-abc');

        $docs = $this->withHeaders($headers)->getJson('/api/knowledge-docs')->json('data');
        $mine = collect($docs)->firstWhere('id', 'kd-abc');
        $this->assertSame('Onboarding SOP', $mine['title']);
        $this->assertSame('People', $mine['category']);
    }

    public function test_knowledge_put_patches_only_what_is_sent(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/knowledge-docs', [
            'id' => 'kd-abc', 'title' => 'Onboarding SOP', 'category' => 'People',
            'version' => 'v1.0', 'type' => 'SOP',
        ])->assertOk();

        // The page bumps a version without resending the rest of the record.
        $this->withHeaders($headers)->putJson('/api/knowledge-docs/kd-abc', ['version' => 'v1.1'])
            ->assertOk()
            ->assertJsonPath('data.version', 'v1.1')
            ->assertJsonPath('data.title', 'Onboarding SOP')
            ->assertJsonPath('data.category', 'People');
    }

    public function test_knowledge_delete_works_and_unknown_id_is_404(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/knowledge-docs', ['id' => 'kd-abc', 'title' => 'Temp'])->assertOk();
        $this->withHeaders($headers)->deleteJson('/api/knowledge-docs/kd-abc')->assertOk();

        $ids = array_column($this->withHeaders($headers)->getJson('/api/knowledge-docs')->json('data'), 'id');
        $this->assertNotContains('kd-abc', $ids);

        $this->withHeaders($headers)->deleteJson('/api/knowledge-docs/kd-nope')->assertStatus(404);
    }

    public function test_seeded_knowledge_docs_are_addressable_by_the_id_they_return(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $docs = $this->withHeaders($headers)->getJson('/api/knowledge-docs')->json('data');
        $this->assertNotEmpty($docs);

        // The id the list hands out must be the id a write accepts — the exact
        // contract that was broken ('D1' resolved to nothing).
        $id = $docs[0]['id'];
        $this->assertNotNull($id);
        $this->withHeaders($headers)->putJson("/api/knowledge-docs/{$id}", ['version' => 'v9.9'])
            ->assertOk()
            ->assertJsonPath('data.version', 'v9.9');
    }

    public function test_knowledge_index_still_filters_by_category_and_query(): void
    {
        $headers = $this->authAs(self::MANAGER);

        $this->withHeaders($headers)->postJson('/api/knowledge-docs', [
            'id' => 'kd-1', 'title' => 'Zebra Handbook', 'category' => 'Ops', 'type' => 'Guideline',
        ])->assertOk();

        $this->withHeaders($headers)->getJson('/api/knowledge-docs?category=Ops')
            ->assertOk()
            ->assertJsonPath('data.0.id', 'kd-1');

        $hits = $this->withHeaders($headers)->getJson('/api/knowledge-docs?q=Zebra')->json('data');
        $this->assertCount(1, $hits);
    }

    // ---- Service requests -------------------------------------------------

    public function test_service_request_is_addressed_by_code_not_numeric_id(): void
    {
        // requests.create belongs to Internal Customer by design (raise a request),
        // separate from requests.view which processes one. Only Administrator holds
        // both among the seeded users.
        $headers = $this->authAs('admin@nexus.co');

        $code = $this->withHeaders($headers)->postJson('/api/service-requests', [
            'title' => 'VPN access', 'requester' => 'Rani K.', 'priority' => 'High',
        ])->assertCreated()->json('data.id');

        $this->assertMatchesRegularExpression('/^SR-\d+$/', $code);

        // This 404'd before: the route bound {service_request} by the numeric id.
        $this->withHeaders($headers)->putJson("/api/service-requests/{$code}", ['status' => 'In Progress'])
            ->assertOk()
            ->assertJsonPath('data.status', 'In Progress');
    }

    public function test_service_request_update_persists_title_and_requester(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $code = ServiceRequest::first()->code;

        // Both are editable in the form but were missing from the validation rules,
        // so the server quietly discarded them.
        $this->withHeaders($headers)->putJson("/api/service-requests/{$code}", [
            'title' => 'Renamed request', 'requester' => 'Someone Else',
        ])->assertOk()
            ->assertJsonPath('data.title', 'Renamed request')
            ->assertJsonPath('data.requester', 'Someone Else');
    }

    public function test_service_request_delete_route_exists(): void
    {
        $headers = $this->authAs(self::MANAGER);
        $code = ServiceRequest::first()->code;

        $this->withHeaders($headers)->deleteJson("/api/service-requests/{$code}")->assertOk();

        $ids = array_column($this->withHeaders($headers)->getJson('/api/service-requests')->json('data'), 'id');
        $this->assertNotContains($code, $ids);
    }
}
