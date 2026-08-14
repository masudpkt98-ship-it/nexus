<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AppraisalController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AiGeneratorController;
use App\Http\Controllers\Api\ArtifactController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatThreadController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\CompassController;
use App\Http\Controllers\Api\CostActivityController;
use App\Http\Controllers\Api\CompetencyController;
use App\Http\Controllers\Api\CompetencyDictionaryController;
use App\Http\Controllers\Api\CompetencyMatrixController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\CorporateKpiController;
use App\Http\Controllers\Api\JobProfileController;
use App\Http\Controllers\Api\KpiTeknisController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\NexianController;
use App\Http\Controllers\Api\PlanningController;
use App\Http\Controllers\Api\RealizationController;
use App\Http\Controllers\Api\SatisfactionController;
use App\Http\Controllers\Api\ObjectiveController;
use App\Http\Controllers\Api\PerformanceKpiController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\StrategyController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

// ---- Public ----
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'NEXUS API', 'version' => '1.0']));
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Employee self-service: look up your own progress by NPK + PIN (no login).
Route::post('/progress/lookup', [ProgressController::class, 'lookup'])->middleware('throttle:20,1');

// ---- Protected (Sanctum bearer token) ----
// A generous per-user rate ceiling (throttle:api) guards the whole authenticated
// surface against runaway/abusive clients.
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:sensitive');

    // Bulk-provision Nexian (KPI Partner) login accounts (Admin only).
    Route::post('/nexian/provision', [NexianController::class, 'provision'])->middleware(['permission:nexian.provision', 'throttle:sensitive']);

    // Publish per-employee KPI progress + access PINs for the public portal (Admin only).
    Route::post('/progress/publish', [ProgressController::class, 'publish'])->middleware(['permission:progress.publish', 'throttle:sensitive']);

    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:dashboard.view');

    // Programs
    Route::get('/programs', [ProgramController::class, 'index'])->middleware('permission:programs.view');
    // Bound by {program:code} — the frontend only ever knows the code (PRG-01),
    // which is what ProgramResource returns as `id`.
    Route::get('/program-milestones', [ProgramController::class, 'milestones'])->middleware('permission:programs.view');
    Route::post('/program-milestones', [ProgramController::class, 'milestoneUpsert'])->middleware('permission:programs.manage');
    Route::delete('/program-milestones/{milestoneId}', [ProgramController::class, 'milestoneDestroy'])->middleware('permission:programs.manage');
    Route::get('/programs/{program:code}', [ProgramController::class, 'show'])->middleware('permission:programs.view');
    Route::post('/programs', [ProgramController::class, 'store'])->middleware('permission:programs.manage');
    Route::put('/programs/{program:code}', [ProgramController::class, 'update'])->middleware('permission:programs.manage');
    Route::delete('/programs/{program:code}', [ProgramController::class, 'destroy'])->middleware('permission:programs.manage');

    // Tasks
    // Cost Optimization — activity budgets, realisasi and LPJ. cost.manage is a
    // deliberate separation of duty: approving spending is not programs.manage.
    Route::get('/cost-activities', [CostActivityController::class, 'index'])->middleware('permission:cost.view');
    Route::post('/cost-activities', [CostActivityController::class, 'upsert'])->middleware('permission:cost.manage');
    Route::delete('/cost-activities/{activityId}', [CostActivityController::class, 'destroy'])->middleware('permission:cost.manage');

    Route::get('/tasks', [TaskController::class, 'index'])->middleware('permission:tasks.view');
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('permission:tasks.manage');
    // Bind by `code` (T-101) — that is the id the client holds (TaskResource.id).
    Route::put('/tasks/{task:code}', [TaskController::class, 'update'])->middleware('permission:tasks.manage');
    Route::patch('/tasks/{task:code}/status', [TaskController::class, 'updateStatus'])->middleware('permission:tasks.manage');
    Route::delete('/tasks/{task:code}', [TaskController::class, 'destroy'])->middleware('permission:tasks.manage');

    // Strategy / OKR
    // Data exports (Excel / PowerPoint)
    // Audit trail (admin only).
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit.view');

    // Employee Directory (PII) — scoped reads; admin-only bulk import.
    // Quarterly-versioned: reads default to the latest Triwulan; history spans all.
    Route::get('/employees', [EmployeeController::class, 'index'])->middleware('permission:people.view');
    Route::get('/employees/periods', [EmployeeController::class, 'periods'])->middleware('permission:people.view');
    Route::get('/employees/{npk}/history', [EmployeeController::class, 'history'])->middleware('permission:people.view');
    Route::post('/employees/import', [EmployeeController::class, 'import'])->middleware(['permission:people.manage', 'throttle:sensitive']);
    Route::delete('/employees', [EmployeeController::class, 'clear'])->middleware('permission:people.manage');

    // Performance Planning — server-enforced, unit-scoped KPIs + KPI Owners.
    Route::get('/planning-kpis', [PlanningController::class, 'kpisIndex'])->middleware('permission:performance.view');
    Route::post('/planning-kpis', [PlanningController::class, 'kpiUpsert'])->middleware('permission:performance.view');
    Route::delete('/planning-kpis/{kpiId}', [PlanningController::class, 'kpiDestroy'])->middleware('permission:performance.view');
    Route::get('/planning-owners', [PlanningController::class, 'ownersIndex'])->middleware('permission:performance.view');
    Route::post('/planning-owners', [PlanningController::class, 'ownerUpsert'])->middleware('permission:performance.view');

    // Performance Monitoring — server-enforced, unit-scoped Realisasi KPI.
    Route::get('/realizations', [RealizationController::class, 'index'])->middleware('permission:performance.view');
    Route::post('/realizations', [RealizationController::class, 'upsert'])->middleware('permission:performance.view');

    // Performance Appraisal — server-enforced, unit-scoped approval + PBI.
    Route::get('/appraisals', [AppraisalController::class, 'index'])->middleware('permission:performance.view');
    Route::post('/appraisals', [AppraisalController::class, 'upsert'])->middleware('permission:performance.manage');

    Route::get('/exports/kpis', [ExportController::class, 'kpis'])->middleware('permission:performance.view');
    Route::get('/exports/competencies', [ExportController::class, 'competencies'])->middleware('permission:competency.view');
    Route::get('/exports/report', [ExportController::class, 'report'])->middleware('permission:analytics.view');

    // Strategy — corporate strategy artifact (Vision/Mission/Values/SWOT/Goals),
    // global; gated on the OKR (objectives) permission.
    Route::get('/strategy', [StrategyController::class, 'index'])->middleware('permission:objectives.view');
    Route::put('/strategy/vision', [StrategyController::class, 'putVision'])->middleware('permission:objectives.manage');
    Route::post('/strategy/items', [StrategyController::class, 'itemUpsert'])->middleware('permission:objectives.manage');
    Route::delete('/strategy/items/{id}', [StrategyController::class, 'itemDestroy'])->middleware('permission:objectives.manage');
    Route::post('/strategy/goals', [StrategyController::class, 'goalUpsert'])->middleware('permission:objectives.manage');
    Route::delete('/strategy/goals/{id}', [StrategyController::class, 'goalDestroy'])->middleware('permission:objectives.manage');

    Route::get('/objectives', [ObjectiveController::class, 'index'])->middleware('permission:objectives.view');
    Route::post('/objectives', [ObjectiveController::class, 'store'])->middleware('permission:objectives.manage');
    Route::put('/objectives/{id}', [ObjectiveController::class, 'update'])->middleware('permission:objectives.manage');
    Route::delete('/objectives/{id}', [ObjectiveController::class, 'destroy'])->middleware('permission:objectives.manage');

    // Competency
    Route::get('/competency', [CompetencyController::class, 'index'])->middleware('permission:competency.view');
    Route::post('/competency', [CompetencyController::class, 'store'])->middleware('permission:competency.manage');
    Route::put('/competency/{competency}', [CompetencyController::class, 'update'])->middleware('permission:competency.manage');
    Route::delete('/competency/{competency}', [CompetencyController::class, 'destroy'])->middleware('permission:competency.manage');
    // Development plans (IDP) — listed by GET /competency, written here. Upsert is
    // keyed by the client plan id so hub edits survive a reload.
    Route::post('/development-plans', [CompetencyController::class, 'planUpsert'])->middleware('permission:competency.manage');
    Route::delete('/development-plans/{planId}', [CompetencyController::class, 'planDestroy'])->middleware('permission:competency.manage');
    // Training calendar — same Development page as the plans above.
    Route::get('/training-sessions', [CompetencyController::class, 'trainingSessions'])->middleware('permission:competency.view');
    Route::post('/training-sessions', [CompetencyController::class, 'trainingUpsert'])->middleware('permission:competency.manage');
    Route::delete('/training-sessions/{sessionId}', [CompetencyController::class, 'trainingDestroy'])->middleware('permission:competency.manage');

    // Kamus Kompetensi — global catalogue + proficiency scale; competency.manage to write.
    Route::get('/competency-dictionary', [CompetencyDictionaryController::class, 'index'])->middleware('permission:competency.view');
    Route::post('/competency-dictionary', [CompetencyDictionaryController::class, 'upsert'])->middleware('permission:competency.manage');
    Route::put('/competency-dictionary/bulk', [CompetencyDictionaryController::class, 'replaceCategory'])->middleware('permission:competency.manage');
    Route::delete('/competency-dictionary/{compId}', [CompetencyDictionaryController::class, 'destroy'])->middleware('permission:competency.manage');
    Route::get('/competency-levels', [CompetencyDictionaryController::class, 'levels'])->middleware('permission:competency.view');
    Route::put('/competency-levels', [CompetencyDictionaryController::class, 'putLevels'])->middleware('permission:competency.manage');

    // Competency Matrix — required standards + assessed levels per group.
    Route::get('/competency-matrix', [CompetencyMatrixController::class, 'index'])->middleware('permission:competency.view');
    Route::post('/competency-standards', [CompetencyMatrixController::class, 'putStandard'])->middleware('permission:competency.manage');
    Route::post('/competency-assessments', [CompetencyMatrixController::class, 'putAssessment'])->middleware('permission:competency.manage');
    Route::delete('/competency-assessments', [CompetencyMatrixController::class, 'destroyAssessment'])->middleware('permission:competency.manage');

    // COMPASS — Gap Analysis levels, Job Profile descriptions, OJT progress.
    Route::get('/competency-current-levels', [CompassController::class, 'currentLevels'])->middleware('permission:competency.view');
    Route::post('/competency-current-levels', [CompassController::class, 'putCurrentLevel'])->middleware('permission:competency.manage');
    Route::get('/job-descriptions', [CompassController::class, 'jobDescriptions'])->middleware('permission:competency.view');
    Route::put('/job-descriptions', [CompassController::class, 'putJobDescriptions'])->middleware('permission:competency.manage');
    Route::get('/ojt-items', [CompassController::class, 'ojt'])->middleware('permission:competency.view');
    Route::post('/ojt-items', [CompassController::class, 'putOjt'])->middleware('permission:competency.manage');

    // Corporate KPI catalogue (Performance Dictionary) — top of the KPI cascade,
    // global (not unit-scoped); performance.manage to write.
    Route::get('/corporate-kpis', [CorporateKpiController::class, 'index'])->middleware('permission:performance.view');
    Route::post('/corporate-kpis', [CorporateKpiController::class, 'upsert'])->middleware('permission:performance.manage');
    Route::delete('/corporate-kpis/{kpiId}', [CorporateKpiController::class, 'destroy'])->middleware('permission:performance.manage');

    // KPI Teknis (Dictionary) — technical KPIs per Job Profile.
    Route::get('/kpi-teknis', [KpiTeknisController::class, 'index'])->middleware('permission:performance.view');
    Route::post('/kpi-teknis', [KpiTeknisController::class, 'upsert'])->middleware('permission:performance.manage');
    Route::delete('/kpi-teknis/{kpiId}', [KpiTeknisController::class, 'destroy'])->middleware('permission:performance.manage');

    // Job Profiles (Dictionary) — role master for mapping/cascade.
    Route::get('/job-profiles', [JobProfileController::class, 'index'])->middleware('permission:performance.view');
    Route::post('/job-profiles', [JobProfileController::class, 'upsert'])->middleware('permission:performance.manage');
    Route::delete('/job-profiles/{profileId}', [JobProfileController::class, 'destroy'])->middleware('permission:performance.manage');

    // Performance
    // Top performers — the hub's ranking (stored client-side under the "appraisals"
    // key, but unrelated to the KPI cascade's /appraisals rows).
    Route::get('/top-performers', [PerformanceKpiController::class, 'performers'])->middleware('permission:performance.view');
    Route::post('/top-performers', [PerformanceKpiController::class, 'performerUpsert'])->middleware('permission:performance.manage');
    Route::delete('/top-performers/{perfId}', [PerformanceKpiController::class, 'performerDestroy'])->middleware('permission:performance.manage');

    Route::get('/performance-kpis', [PerformanceKpiController::class, 'index'])->middleware('permission:performance.view');
    Route::post('/performance-kpis', [PerformanceKpiController::class, 'store'])->middleware('permission:performance.manage');
    Route::put('/performance-kpis/{code}', [PerformanceKpiController::class, 'update'])->middleware('permission:performance.manage');
    Route::delete('/performance-kpis/{code}', [PerformanceKpiController::class, 'destroy'])->middleware('permission:performance.manage');

    // Customer requests
    Route::get('/service-requests', [ServiceRequestController::class, 'index'])->middleware('permission:requests.view');
    Route::post('/service-requests', [ServiceRequestController::class, 'store'])->middleware('permission:requests.create');
    Route::put('/service-requests/{service_request}', [ServiceRequestController::class, 'update'])->middleware('permission:requests.view');

    // Satisfaction, Analytics & AI
    // Satisfaction. Writes share satisfaction.view — the page is ungated in the UI
    // and the RBAC map has no satisfaction.manage.
    Route::get('/satisfaction', [SatisfactionController::class, 'index'])->middleware('permission:satisfaction.view');
    Route::post('/satisfaction/responses', [SatisfactionController::class, 'storeResponse'])->middleware('permission:satisfaction.view');
    Route::post('/satisfaction/services', [SatisfactionController::class, 'upsertService'])->middleware('permission:satisfaction.view');
    Route::delete('/satisfaction/services/{serviceId}', [SatisfactionController::class, 'destroyService'])->middleware('permission:satisfaction.view');
    Route::get('/analytics', [AnalyticsController::class, 'index'])->middleware('permission:analytics.view');
    Route::get('/ai/insights', [AiController::class, 'insights'])->middleware('permission:ai.view');
    Route::post('/ai/chat', [AiController::class, 'chat'])->middleware('permission:ai.view');
    Route::post('/ai/chat/stream', [AiController::class, 'chatStream'])->middleware('permission:ai.view');

    // Conversation threads
    Route::get('/ai/threads', [ChatThreadController::class, 'index'])->middleware('permission:ai.view');
    Route::post('/ai/threads', [ChatThreadController::class, 'store'])->middleware('permission:ai.view');
    Route::put('/ai/threads/{id}', [ChatThreadController::class, 'update'])->middleware('permission:ai.view');
    Route::delete('/ai/threads/{id}', [ChatThreadController::class, 'destroy'])->middleware('permission:ai.view');
    Route::get('/ai/threads/{id}/messages', [ChatThreadController::class, 'messages'])->middleware('permission:ai.view');

    // AI generators (Markdown artifacts grounded in live data)
    Route::post('/ai/generate/kpi', [AiGeneratorController::class, 'kpi'])->middleware('permission:ai.view');
    Route::post('/ai/generate/idp', [AiGeneratorController::class, 'idp'])->middleware('permission:ai.view');
    Route::post('/ai/generate/report', [AiGeneratorController::class, 'report'])->middleware('permission:ai.view');
    Route::post('/ai/generate/{kind}/stream', [AiGeneratorController::class, 'stream'])
        ->whereIn('kind', ['kpi', 'idp', 'report'])
        ->middleware('permission:ai.view');

    // Saved generator artifacts (per-user history)
    Route::get('/ai/artifacts', [ArtifactController::class, 'index'])->middleware('permission:ai.view');
    Route::post('/ai/artifacts/pdf', [ArtifactController::class, 'pdf'])->middleware('permission:ai.view');
    Route::post('/ai/artifacts', [ArtifactController::class, 'store'])->middleware('permission:ai.view');
    Route::get('/ai/artifacts/{id}', [ArtifactController::class, 'show'])->middleware('permission:ai.view');
    Route::delete('/ai/artifacts/{id}', [ArtifactController::class, 'destroy'])->middleware('permission:ai.view');

    // Document Management — global catalogue; gated on the Workspace read
    // permission every role holds (the module is ungated in the UI).
    Route::get('/documents', [DocumentController::class, 'index'])->middleware('permission:knowledge.view');
    Route::post('/documents', [DocumentController::class, 'store'])->middleware('permission:knowledge.view');
    Route::put('/documents/{docId}', [DocumentController::class, 'update'])->middleware('permission:knowledge.view');
    Route::delete('/documents/{docId}', [DocumentController::class, 'destroy'])->middleware('permission:knowledge.view');

    // Workspace
    // Meetings, agenda and action items. Writes share meetings.view: the module is
    // ungated in the UI and the RBAC map has no meetings.manage.
    Route::get('/meetings', [MeetingController::class, 'index'])->middleware('permission:meetings.view');
    Route::post('/meetings', [MeetingController::class, 'upsert'])->middleware('permission:meetings.view');
    Route::delete('/meetings/{meetingId}', [MeetingController::class, 'destroy'])->middleware('permission:meetings.view');
    Route::get('/meeting-agenda', [MeetingController::class, 'agenda'])->middleware('permission:meetings.view');
    Route::post('/meeting-agenda', [MeetingController::class, 'agendaUpsert'])->middleware('permission:meetings.view');
    Route::delete('/meeting-agenda/{itemId}', [MeetingController::class, 'agendaDestroy'])->middleware('permission:meetings.view');
    Route::get('/meeting-actions', [MeetingController::class, 'actions'])->middleware('permission:meetings.view');
    Route::post('/meeting-actions', [MeetingController::class, 'actionUpsert'])->middleware('permission:meetings.view');
    Route::delete('/meeting-actions/{itemId}', [MeetingController::class, 'actionDestroy'])->middleware('permission:meetings.view');
    Route::get('/knowledge-docs', [WorkspaceController::class, 'knowledge'])->middleware('permission:knowledge.view');
    Route::get('/notifications', [WorkspaceController::class, 'notifications'])->middleware('permission:notifications.view');
    Route::post('/notifications/read-all', [WorkspaceController::class, 'markAllRead'])->middleware('permission:notifications.view');
    Route::get('/activities', [WorkspaceController::class, 'activities'])->middleware('permission:dashboard.view');
});
