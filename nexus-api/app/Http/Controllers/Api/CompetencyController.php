<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompetencyResource;
use App\Http\Resources\DevelopmentPlanResource;
use App\Models\Competency;
use App\Models\DevelopmentPlan;
use Illuminate\Http\JsonResponse;

class CompetencyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'competencies' => CompetencyResource::collection(Competency::orderBy('id')->get()),
            'developmentPlans' => DevelopmentPlanResource::collection(DevelopmentPlan::orderByDesc('readiness')->get()),
        ]);
    }
}
