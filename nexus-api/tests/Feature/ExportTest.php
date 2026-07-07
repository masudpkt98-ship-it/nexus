<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_kpi_excel_export_returns_xlsx(): void
    {
        $res = $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))->get('/api/exports/kpis');

        $res->assertOk();
        $this->assertStringContainsString('spreadsheetml.sheet', (string) $res->headers->get('content-type'));
    }

    public function test_competency_excel_export_returns_xlsx(): void
    {
        $res = $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))->get('/api/exports/competencies');

        $res->assertOk();
        $this->assertStringContainsString('spreadsheetml.sheet', (string) $res->headers->get('content-type'));
    }

    public function test_report_powerpoint_export_returns_pptx(): void
    {
        $res = $this->withHeaders($this->authAs('arif.wibowo@nexus.co'))->get('/api/exports/report');

        $res->assertOk();
        $this->assertStringContainsString('presentationml.presentation', (string) $res->headers->get('content-type'));
    }
}
