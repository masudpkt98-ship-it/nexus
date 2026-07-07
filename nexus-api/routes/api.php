<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AiGeneratorController;
use App\Http\Controllers\Api\ArtifactController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatThreadController;
use App\Http\Controllers\Api\CompetencyController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SatisfactionController;
use App\Http\Controllers\Api\ObjectiveController;
use App\Http\Controllers\Api\PerformanceKpiController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

// ---- Public ----
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'NEXUS API', 'version' => '1.0']));
Route::post('/auth/login', [AuthController::class, 'login']);

// ---- Protected (Sanctum bearer token) ----
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:dashboard.view');

    // Programs
    Route::get('/programs', [ProgramController::class, 'index'])->middleware('permission:programs.view');
    Route::get('/programs/{program}', [ProgramController::class, 'show'])->middleware('permission:programs.view');
    Route::post('/programs', [ProgramController::class, 'store'])->middleware('permission:programs.manage');
    Route::put('/programs/{program}', [ProgramController::class, 'update'])->middleware('permission:programs.manage');
    Route::delete('/programs/{program}', [ProgramController::class, 'destroy'])->middleware('permission:programs.manage');

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index'])->middleware('permission:tasks.view');
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('permission:tasks.manage');
    Route::put('/tasks/{task}', [TaskController::class, 'update'])->middleware('permission:tasks.manage');
    Route::patch('/tasks/{task}/status', [TaskController::class, 'updateStatus'])->middleware('permission:tasks.manage');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->middleware('permission:tasks.manage');

    // Strategy / OKR
    Route::get('/objectives', [ObjectiveController::class, 'index'])->middleware('permission:objectives.view');
    Route::post('/objectives', [ObjectiveController::class, 'store'])->middleware('permission:objectives.manage');
    Route::put('/objectives/{id}', [ObjectiveController::class, 'update'])->middleware('permission:objectives.manage');
    Route::delete('/objectives/{id}', [ObjectiveController::class, 'destroy'])->middleware('permission:objectives.manage');

    // Competency
    Route::get('/competency', [CompetencyController::class, 'index'])->middleware('permission:competency.view');
    Route::post('/competency', [CompetencyController::class, 'store'])->middleware('permission:competency.manage');
    Route::put('/competency/{competency}', [CompetencyController::class, 'update'])->middleware('permission:competency.manage');
    Route::delete('/competency/{competency}', [CompetencyController::class, 'destroy'])->middleware('permission:competency.manage');

    // Performance
    Route::get('/performance-kpis', [PerformanceKpiController::class, 'index'])->middleware('permission:performance.view');
    Route::post('/performance-kpis', [PerformanceKpiController::class, 'store'])->middleware('permission:performance.manage');
    Route::put('/performance-kpis/{code}', [PerformanceKpiController::class, 'update'])->middleware('permission:performance.manage');
    Route::delete('/performance-kpis/{code}', [PerformanceKpiController::class, 'destroy'])->middleware('permission:performance.manage');

    // Customer requests
    Route::get('/service-requests', [ServiceRequestController::class, 'index'])->middleware('permission:requests.view');
    Route::post('/service-requests', [ServiceRequestController::class, 'store'])->middleware('permission:requests.create');
    Route::put('/service-requests/{service_request}', [ServiceRequestController::class, 'update'])->middleware('permission:requests.view');

    // Satisfaction, Analytics & AI
    Route::get('/satisfaction', [SatisfactionController::class, 'index'])->middleware('permission:satisfaction.view');
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
    Route::post('/ai/artifacts', [ArtifactController::class, 'store'])->middleware('permission:ai.view');
    Route::get('/ai/artifacts/{id}', [ArtifactController::class, 'show'])->middleware('permission:ai.view');
    Route::delete('/ai/artifacts/{id}', [ArtifactController::class, 'destroy'])->middleware('permission:ai.view');

    // Workspace
    Route::get('/meetings', [WorkspaceController::class, 'meetings'])->middleware('permission:meetings.view');
    Route::get('/knowledge-docs', [WorkspaceController::class, 'knowledge'])->middleware('permission:knowledge.view');
    Route::get('/notifications', [WorkspaceController::class, 'notifications'])->middleware('permission:notifications.view');
    Route::post('/notifications/read-all', [WorkspaceController::class, 'markAllRead'])->middleware('permission:notifications.view');
    Route::get('/activities', [WorkspaceController::class, 'activities'])->middleware('permission:dashboard.view');
});
