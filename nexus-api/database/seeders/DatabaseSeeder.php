<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\AiInsight;
use App\Models\Competency;
use App\Models\MetricPoint;
use App\Models\NpsResponse;
use App\Models\SatisfactionService;
use App\Models\DevelopmentPlan;
use App\Models\KeyResult;
use App\Models\KnowledgeDoc;
use App\Models\Meeting;
use App\Models\NotificationItem;
use App\Models\Objective;
use App\Models\PerformanceKpi;
use App\Models\Program;
use App\Models\ServiceRequest;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // -------------------- Users (password: "nexus") --------------------
        $users = [
            ['name' => 'Arif Wibowo', 'email' => 'arif.wibowo@nexus.co', 'role' => 'VP', 'title' => 'VP Competency & Performance', 'avatar' => 'AW'],
            ['name' => 'Sinta Larasati', 'email' => 'sinta@nexus.co', 'role' => 'Manager', 'title' => 'Manager Performance', 'avatar' => 'SL'],
            ['name' => 'Dimas Prakoso', 'email' => 'dimas@nexus.co', 'role' => 'Supervisor', 'title' => 'Supervisor Development', 'avatar' => 'DP'],
            ['name' => 'Rani Kusuma', 'email' => 'rani@nexus.co', 'role' => 'Staff', 'title' => 'Competency Analyst', 'avatar' => 'RK'],
            ['name' => 'Bagus Hartono', 'email' => 'bagus@nexus.co', 'role' => 'Executive', 'title' => 'Director Operations', 'avatar' => 'BH'],
            ['name' => 'Admin Nexus', 'email' => 'admin@nexus.co', 'role' => 'Administrator', 'title' => 'System Administrator', 'avatar' => 'AN'],
            // Nexian (KPI Partner team) — data scoped to their unit kerja / directorate.
            ['name' => 'Kharisma Ayuning Putri', 'email' => 'kharisma@nexus.co', 'role' => 'KPI Partner', 'title' => 'KPI Partner', 'avatar' => 'KA', 'npk' => '4234747', 'unit' => 'Departemen Audit Bisnis & Keuangan', 'directorate' => 'Direktorat Utama'],
            ['name' => 'Rahmadian Ariseno', 'email' => 'rahmadian@nexus.co', 'role' => 'KPI Partner Manajemen', 'title' => 'KPI Partner Manajemen', 'avatar' => 'RA', 'npk' => '4144364', 'unit' => 'Satuan Pengawasan Intern', 'directorate' => 'Direktorat Utama'],
        ];

        $byEmail = [];
        foreach ($users as $u) {
            $byEmail[$u['email']] = User::create([
                ...$u,
                'password' => Hash::make('nexus'),
                'email_verified_at' => now(),
            ]);
        }

        $arif = $byEmail['arif.wibowo@nexus.co'];
        $sinta = $byEmail['sinta@nexus.co'];
        $dimas = $byEmail['dimas@nexus.co'];
        $rani = $byEmail['rani@nexus.co'];
        $bagus = $byEmail['bagus@nexus.co'];

        // -------------------- Programs --------------------
        $programs = [
            ['code' => 'PRG-01', 'name' => 'Competency Digital Transformation', 'owner_id' => $arif->id, 'status' => 'On Track', 'progress' => 72, 'budget' => 850, 'spent' => 540, 'risk' => 'Low', 'milestones' => 8, 'milestones_done' => 5, 'start_date' => '2026-01-10', 'end_date' => '2026-11-30'],
            ['code' => 'PRG-02', 'name' => 'Leadership Development 2026', 'owner_id' => $dimas->id, 'status' => 'At Risk', 'progress' => 48, 'budget' => 420, 'spent' => 300, 'risk' => 'Medium', 'milestones' => 6, 'milestones_done' => 2, 'start_date' => '2026-02-01', 'end_date' => '2026-09-15'],
            ['code' => 'PRG-03', 'name' => 'Performance Automation Suite', 'owner_id' => $sinta->id, 'status' => 'On Track', 'progress' => 66, 'budget' => 610, 'spent' => 380, 'risk' => 'Low', 'milestones' => 7, 'milestones_done' => 4, 'start_date' => '2026-03-05', 'end_date' => '2026-12-20'],
            ['code' => 'PRG-04', 'name' => 'Customer Experience Uplift', 'owner_id' => $bagus->id, 'status' => 'Delayed', 'progress' => 35, 'budget' => 300, 'spent' => 210, 'risk' => 'High', 'milestones' => 5, 'milestones_done' => 1, 'start_date' => '2026-01-20', 'end_date' => '2026-08-30'],
            ['code' => 'PRG-05', 'name' => 'Knowledge Base Modernization', 'owner_id' => $rani->id, 'status' => 'Completed', 'progress' => 100, 'budget' => 180, 'spent' => 172, 'risk' => 'Low', 'milestones' => 4, 'milestones_done' => 4, 'start_date' => '2025-09-01', 'end_date' => '2026-03-31'],
        ];
        $prog = [];
        foreach ($programs as $p) {
            $prog[$p['code']] = Program::create($p);
        }

        // -------------------- Tasks --------------------
        $tasks = [
            ['code' => 'T-101', 'title' => 'Draft Q3 KPI cascade for Performance team', 'status' => 'In Progress', 'priority' => 'High', 'assignee_id' => $sinta->id, 'program_id' => $prog['PRG-03']->id, 'due_date' => '2026-07-10', 'checklist_total' => 6, 'checklist_done' => 4, 'comments_count' => 3, 'tags' => ['KPI', 'Q3']],
            ['code' => 'T-102', 'title' => 'Competency gap analysis — Analytics', 'status' => 'Review', 'priority' => 'Critical', 'assignee_id' => $rani->id, 'program_id' => $prog['PRG-01']->id, 'due_date' => '2026-07-08', 'checklist_total' => 8, 'checklist_done' => 8, 'comments_count' => 5, 'tags' => ['Competency']],
            ['code' => 'T-103', 'title' => 'Finalize Leadership curriculum module 3', 'status' => 'Backlog', 'priority' => 'Medium', 'assignee_id' => $dimas->id, 'program_id' => $prog['PRG-02']->id, 'due_date' => '2026-07-18', 'checklist_total' => 5, 'checklist_done' => 1, 'comments_count' => 1, 'tags' => ['Training']],
            ['code' => 'T-104', 'title' => 'Migrate SOP library to new KM system', 'status' => 'In Progress', 'priority' => 'Medium', 'assignee_id' => $rani->id, 'program_id' => $prog['PRG-05']->id, 'due_date' => '2026-07-14', 'checklist_total' => 10, 'checklist_done' => 7, 'comments_count' => 2, 'tags' => ['Knowledge']],
            ['code' => 'T-105', 'title' => 'Configure SLA rules for service requests', 'status' => 'Done', 'priority' => 'High', 'assignee_id' => $sinta->id, 'program_id' => $prog['PRG-03']->id, 'due_date' => '2026-07-02', 'checklist_total' => 4, 'checklist_done' => 4, 'comments_count' => 0, 'tags' => ['SLA']],
            ['code' => 'T-106', 'title' => 'Executive dashboard traffic-light logic', 'status' => 'In Progress', 'priority' => 'High', 'assignee_id' => $arif->id, 'program_id' => $prog['PRG-03']->id, 'due_date' => '2026-07-11', 'checklist_total' => 7, 'checklist_done' => 3, 'comments_count' => 4, 'tags' => ['Dashboard']],
            ['code' => 'T-107', 'title' => 'CX survey redesign & NPS mapping', 'status' => 'Backlog', 'priority' => 'Critical', 'assignee_id' => $bagus->id, 'program_id' => $prog['PRG-04']->id, 'due_date' => '2026-07-20', 'checklist_total' => 6, 'checklist_done' => 0, 'comments_count' => 2, 'tags' => ['CX', 'NPS']],
            ['code' => 'T-108', 'title' => 'Approve training budget PRG-02', 'status' => 'Review', 'priority' => 'High', 'assignee_id' => $arif->id, 'program_id' => $prog['PRG-02']->id, 'due_date' => '2026-07-09', 'checklist_total' => 3, 'checklist_done' => 2, 'comments_count' => 6, 'tags' => ['Approval']],
            ['code' => 'T-109', 'title' => 'Publish IDP templates for supervisors', 'status' => 'Done', 'priority' => 'Low', 'assignee_id' => $dimas->id, 'program_id' => $prog['PRG-01']->id, 'due_date' => '2026-06-30', 'checklist_total' => 5, 'checklist_done' => 5, 'comments_count' => 1, 'tags' => ['IDP']],
            ['code' => 'T-110', 'title' => 'Set up Redis cache for analytics API', 'status' => 'Backlog', 'priority' => 'Medium', 'assignee_id' => $rani->id, 'program_id' => $prog['PRG-03']->id, 'due_date' => '2026-07-22', 'checklist_total' => 4, 'checklist_done' => 0, 'comments_count' => 0, 'tags' => ['Tech']],
        ];
        foreach ($tasks as $t) {
            Task::create($t);
        }

        // -------------------- Objectives (OKR) --------------------
        $okrs = [
            ['title' => 'Elevate department competency maturity to Level 4', 'owner_id' => $arif->id, 'progress' => 68, 'krs' => [
                ['Assess 100% of staff against matrix', 92], ['Close 60% of critical competency gaps', 54], ['Launch 3 development programs', 66],
            ]],
            ['title' => 'Achieve 95% on-time execution across programs', 'owner_id' => $sinta->id, 'progress' => 74, 'krs' => [
                ['Reduce overdue tasks below 8%', 70], ['Automate 40% of admin workflows', 61], ['Milestone adherence ≥ 90%', 88],
            ]],
            ['title' => 'Deliver best-in-class internal customer value', 'owner_id' => $bagus->id, 'progress' => 81, 'krs' => [
                ['NPS ≥ 55', 84], ['SLA compliance ≥ 95%', 79], ['CSAT ≥ 4.5', 80],
            ]],
        ];
        foreach ($okrs as $o) {
            $obj = Objective::create(['title' => $o['title'], 'owner_id' => $o['owner_id'], 'progress' => $o['progress'], 'quarter' => 'FY26']);
            foreach ($o['krs'] as $kr) {
                KeyResult::create(['objective_id' => $obj->id, 'title' => $kr[0], 'progress' => $kr[1]]);
            }
        }

        // -------------------- Competencies --------------------
        foreach ([
            ['Strategic Leadership', 'Leadership', 4, 3], ['Data Analytics', 'Technical', 4, 3],
            ['Performance Coaching', 'People', 5, 4], ['Project Management', 'Delivery', 4, 4],
            ['Stakeholder Communication', 'People', 4, 3], ['Process Automation', 'Technical', 3, 2],
            ['Financial Acumen', 'Business', 3, 3], ['Change Management', 'Leadership', 4, 2],
        ] as $c) {
            Competency::create(['name' => $c[0], 'category' => $c[1], 'required_level' => $c[2], 'current_level' => $c[3]]);
        }

        // -------------------- Development plans --------------------
        foreach ([
            [$rani, 'Rani Kusuma', 'RK', 'Competency Analyst', 74, 2, 'Advanced Analytics Certification'],
            [$dimas, 'Dimas Prakoso', 'DP', 'Supervisor Development', 81, 1, 'Leadership Simulation Lab'],
            [$sinta, 'Sinta Larasati', 'SL', 'Manager Performance', 88, 1, 'Executive Coaching'],
            [$bagus, 'Bagus Hartono', 'BH', 'Director Operations', 92, 0, 'Board Readiness Program'],
        ] as $d) {
            DevelopmentPlan::create([
                'user_id' => $d[0]->id, 'employee' => $d[1], 'avatar' => $d[2], 'role' => $d[3],
                'readiness' => $d[4], 'gaps' => $d[5], 'next_step' => $d[6],
            ]);
        }

        // -------------------- Performance KPIs --------------------
        foreach ([
            ['K1', 'Program On-Time Delivery', 'Department', 25, 95, 91, '%'],
            ['K2', 'Competency Gap Closure', 'Department', 20, 60, 54, '%'],
            ['K3', 'Internal CSAT', 'Corporate', 20, 4.5, 4.4, '/5'],
            ['K4', 'SLA Compliance', 'Department', 15, 95, 93, '%'],
            ['K5', 'Training Effectiveness', 'Individual', 10, 85, 88, '%'],
            ['K6', 'Cost Efficiency', 'Corporate', 10, 100, 104, '%'],
        ] as $k) {
            PerformanceKpi::create([
                'code' => $k[0], 'name' => $k[1], 'level' => $k[2], 'weight' => $k[3],
                'target' => $k[4], 'actual' => $k[5], 'unit' => $k[6],
            ]);
        }

        // -------------------- Service requests --------------------
        foreach ([
            ['SR-2041', 'Access to performance data warehouse', 'Bagus H.', 'High', 'Within SLA', 'In Progress', $rani->id, 'Rani K.'],
            ['SR-2042', 'New competency dashboard for Ops', 'Ops Dept.', 'Medium', 'At Risk', 'Waiting Approval', $sinta->id, 'Sinta L.'],
            ['SR-2043', 'Bulk training enrollment — 40 staff', 'HR Dept.', 'High', 'Within SLA', 'New', $dimas->id, 'Dimas P.'],
            ['SR-2044', 'Export Q2 appraisal reports', 'Finance', 'Low', 'Breached', 'In Progress', $rani->id, 'Rani K.'],
            ['SR-2045', 'Integrate Outlook calendar sync', 'IT Dept.', 'Medium', 'Within SLA', 'Resolved', $arif->id, 'Arif W.'],
        ] as $s) {
            ServiceRequest::create([
                'code' => $s[0], 'title' => $s[1], 'requester' => $s[2], 'priority' => $s[3],
                'sla' => $s[4], 'status' => $s[5], 'pic_id' => $s[6], 'pic' => $s[7],
            ]);
        }

        // -------------------- Meetings --------------------
        foreach ([
            ['Quarterly Performance Review', 'Today · 14:00', now()->setTime(14, 0), 8, 5],
            ['Competency Council Sync', 'Tomorrow · 10:00', now()->addDay()->setTime(10, 0), 5, 3],
            ['Program Aurora Standup', 'Wed · 09:30', now()->addDays(2)->setTime(9, 30), 6, 2],
        ] as $m) {
            Meeting::create(['title' => $m[0], 'scheduled_label' => $m[1], 'scheduled_at' => $m[2], 'attendees' => $m[3], 'action_items' => $m[4]]);
        }

        // -------------------- Knowledge docs --------------------
        foreach ([
            ['Competency Assessment SOP', 'Competency', 'v3.2', 'SOP', 'Approved', 'Rani Kusuma', '2026-06-20'],
            ['KPI Cascade Guideline', 'Performance', 'v2.0', 'Guideline', 'Approved', 'Sinta Larasati', '2026-05-11'],
            ['IDP Template 2026', 'Development', 'v1.4', 'Template', 'Approved', 'Dimas Prakoso', '2026-06-01'],
            ['Leadership Program Deck', 'Development', 'v1.0', 'Presentation', 'Pending', 'Dimas Prakoso', '2026-06-28'],
            ['Service Request Handling SOP', 'Customer', 'v2.5', 'SOP', 'Approved', 'Bagus Hartono', '2026-06-15'],
        ] as $k) {
            KnowledgeDoc::create([
                'title' => $k[0], 'category' => $k[1], 'version' => $k[2], 'type' => $k[3],
                'approval' => $k[4], 'owner' => $k[5], 'updated_on' => $k[6],
            ]);
        }

        // -------------------- Notifications --------------------
        foreach ([
            ['In-App', 'approval', 'Task T-102 moved to Review — needs your approval', '5m', false],
            ['Email', 'deadline', 'Deadline tomorrow: Q3 KPI cascade (T-101)', '1h', false],
            ['WhatsApp', 'training', 'Leadership training starts Monday 09:00', '3h', true],
            ['Push', 'birthday', "It's Sinta Larasati's birthday today", '6h', true],
            ['In-App', 'system', 'AI flagged a schedule risk on Project Aurora', '8h', true],
        ] as $n) {
            NotificationItem::create([
                'user_id' => $arif->id, 'channel' => $n[0], 'kind' => $n[1],
                'title' => $n[2], 'time_label' => $n[3], 'read' => $n[4],
            ]);
        }

        // -------------------- Activities --------------------
        foreach ([
            [$sinta, 'Sinta L.', 'completed task', 'Q3 KPI Cascade', 'task'],
            [$dimas, 'Dimas P.', 'requested approval for', 'Leadership Program Budget', 'approval'],
            [$rani, 'Rani K.', 'updated competency gap for', 'Analytics Team', 'kpi'],
            [null, 'System AI', 'flagged risk on', 'Project Aurora timeline', 'task'],
            [$bagus, 'Bagus H.', 'submitted request', 'SR-2041 Data Access', 'request'],
            [$sinta, 'Sinta L.', 'scheduled meeting', 'Quarterly Review', 'meeting'],
            [$rani, 'Rani K.', 'enrolled in', 'Advanced Analytics Cert.', 'training'],
        ] as $i => $a) {
            Activity::create([
                'user_id' => $a[0]?->id, 'actor' => $a[1], 'action' => $a[2],
                'target' => $a[3], 'type' => $a[4],
                'created_at' => now()->subMinutes(($i + 1) * 40),
                'updated_at' => now()->subMinutes(($i + 1) * 40),
            ]);
        }

        // -------------------- AI insights --------------------
        foreach ([
            ['risk', 'Project Aurora likely to slip 2 weeks', 'Milestone velocity dropped 18% over the last sprint. 3 critical tasks are unassigned and 2 dependencies are blocked.', 87],
            ['recommendation', 'Rebalance workload for Competency team', 'Competency team is at 128% capacity while Strategy is at 61%. Reassign 4 non-critical tasks to level utilization.', 79],
            ['prediction', 'Q3 KPI achievement forecast: 89%', 'Based on current trend, overall KPI will reach 89% by quarter end — just below the 90% target. Focus on Competency Index to close the gap.', 82],
            ['summary', 'Weekly executive summary ready', '12 tasks completed, 3 programs advanced, 1 risk flagged, CSAT up 0.1. Full narrative report generated and ready to export.', 95],
        ] as $pos => $a) {
            AiInsight::create(['type' => $a[0], 'title' => $a[1], 'body' => $a[2], 'confidence' => $a[3], 'position' => $pos]);
        }

        // -------------------- Satisfaction by service --------------------
        foreach ([
            ['Competency Assessment', 4.5], ['Training Delivery', 4.6], ['Performance Review', 4.2],
            ['Data & Reporting', 4.1], ['Service Requests', 4.4],
        ] as $pos => $s) {
            SatisfactionService::create(['service' => $s[0], 'score' => $s[1], 'position' => $pos]);
        }

        // -------------------- NPS survey responses (NPS ≈ 51) --------------------
        $rows = [];
        foreach (['promoter' => [74, 10], 'passive' => [32, 8], 'detractor' => [13, 5]] as $cfg) {
            for ($i = 0; $i < $cfg[0]; $i++) {
                $rows[] = ['score' => $cfg[1]];
            }
        }
        NpsResponse::insert($rows);

        // -------------------- Metric time-series --------------------
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
        $series = [
            'kpi' => [72, 74, 78, 77, 82, 85, 87],
            'satisfaction' => [4.0, 4.1, 4.1, 4.2, 4.3, 4.3, 4.4],
            'idx_productivity' => [70, 74, 76, 78, 80, 82, 84],
            'idx_competency' => [80, 79, 79, 78, 77, 78, 78],
            'idx_training' => [79, 81, 83, 84, 86, 87, 88],
            'idx_sla' => [88, 89, 90, 91, 92, 92, 93],
        ];
        foreach ($series as $name => $values) {
            foreach ($values as $pos => $v) {
                MetricPoint::create(['series' => $name, 'label' => $months[$pos], 'value' => $v, 'position' => $pos]);
            }
        }
    }
}
