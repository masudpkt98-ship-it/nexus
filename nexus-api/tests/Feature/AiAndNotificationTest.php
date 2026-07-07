<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiAndNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_generator_returns_data_grounded_markdown_without_api_key(): void
    {
        config(['services.anthropic.key' => null]);

        $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))
            ->postJson('/api/ai/generate/report', ['scope' => 'Q3 Review'])
            ->assertOk()
            ->assertJsonPath('source', 'rules')
            ->assertJsonStructure(['title', 'markdown', 'source']);
    }

    public function test_pdf_export_returns_a_pdf_document(): void
    {
        $res = $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))
            ->postJson('/api/ai/artifacts/pdf', ['title' => 'Report', 'markdown' => "# Report\n\nHello **world**."]);

        $res->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $res->headers->get('content-type'));
    }

    public function test_creating_a_competency_raises_a_notification(): void
    {
        $headers = $this->authAs('arif.wibowo@nexus.co');

        $this->withHeaders($headers)
            ->postJson('/api/competency', ['name' => 'Realtime Skill', 'category' => 'Technical', 'current' => 2, 'required' => 4])
            ->assertCreated();

        $this->withHeaders($headers)
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonFragment(['title' => 'New competency added: Realtime Skill']);
    }
}
