<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competency;
use App\Models\PerformanceKpi;
use App\Services\NexusData;
use PhpOffice\PhpPresentation\PhpPresentation;
use PhpOffice\PhpPresentation\Style\Alignment;
use PhpOffice\PhpPresentation\Style\Color;
use PhpOffice\PhpPresentation\Writer\PowerPoint2007;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Data exports: KPI scorecard / competency matrix as Excel (.xlsx) and an
 * executive overview as PowerPoint (.pptx), all built from live NEXUS data.
 */
class ExportController extends Controller
{
    public function kpis(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('KPI Scorecard');
        $sheet->fromArray(['Code', 'Name', 'Level', 'Weight (%)', 'Target', 'Actual', 'Unit'], null, 'A1');

        $row = 2;
        foreach (PerformanceKpi::orderByDesc('weight')->get() as $k) {
            $sheet->fromArray([$k->code, $k->name, $k->level, $k->weight, $k->target, $k->actual, $k->unit], null, "A{$row}");
            $row++;
        }

        $this->styleHeader($sheet, 'A1:G1');

        return $this->streamXlsx($spreadsheet, 'nexus-kpis');
    }

    public function competencies(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Competency Matrix');
        $sheet->fromArray(['Name', 'Category', 'Current', 'Required', 'Gap'], null, 'A1');

        $row = 2;
        foreach (Competency::orderBy('id')->get() as $c) {
            $gap = max(0, $c->required_level - $c->current_level);
            $sheet->fromArray([$c->name, $c->category, $c->current_level, $c->required_level, $gap], null, "A{$row}");
            $row++;
        }

        $this->styleHeader($sheet, 'A1:E1');

        return $this->streamXlsx($spreadsheet, 'nexus-competencies');
    }

    public function report(): StreamedResponse
    {
        $c = NexusData::context();
        $ppt = new PhpPresentation();
        $navy = 'FF0F172A';
        $blue = 'FF1D4ED8';

        // Slide 1 — title
        $slide = $ppt->getActiveSlide();
        $title = $slide->createRichTextShape()->setHeight(120)->setWidth(840)->setOffsetX(60)->setOffsetY(160);
        $title->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $run = $title->createTextRun('NEXUS — Executive Overview');
        $run->getFont()->setBold(true)->setSize(34)->setColor(new Color($navy));
        $sub = $slide->createRichTextShape()->setHeight(60)->setWidth(840)->setOffsetX(60)->setOffsetY(280);
        $sub->getActiveParagraph()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sub->createTextRun('Competency & Performance — department snapshot')
            ->getFont()->setSize(16)->setColor(new Color($blue));

        // Slide 2 — snapshot bullets
        $slide2 = $ppt->createSlide();
        $head = $slide2->createRichTextShape()->setHeight(60)->setWidth(840)->setOffsetX(50)->setOffsetY(40);
        $head->createTextRun('Snapshot')->getFont()->setBold(true)->setSize(26)->setColor(new Color($blue));

        $bullets = $slide2->createRichTextShape()->setHeight(360)->setWidth(840)->setOffsetX(50)->setOffsetY(120);
        $lines = [
            "Weighted overall KPI: {$c['overallKpi']}% (target 90%)",
            "Open tasks: {$c['open']} — {$c['overdue']} overdue, {$c['review']} in review",
            "Programs: {$c['onTrack']} on track, {$c['atRisk']} at risk/delayed",
            "Customer requests: {$c['openRequests']} open ({$c['breached']} SLA breached)",
            "Competency gaps below target: {$c['competencyGaps']}",
        ];
        $first = true;
        foreach ($lines as $line) {
            $p = $first ? $bullets->getActiveParagraph() : $bullets->createParagraph();
            $first = false;
            $p->getBulletStyle()->setBulletType(\PhpOffice\PhpPresentation\Style\Bullet::TYPE_BULLET);
            $p->createTextRun($line)->getFont()->setSize(18)->setColor(new Color($navy));
        }

        $writer = new PowerPoint2007($ppt);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'nexus-executive-overview.pptx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ]);
    }

    private function styleHeader($sheet, string $range): void
    {
        $sheet->getStyle($range)->getFont()->setBold(true);
        foreach (range('A', substr($range, -2, 1)) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    private function streamXlsx(Spreadsheet $spreadsheet, string $name): StreamedResponse
    {
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, "{$name}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
