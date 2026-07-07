<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompetencyResource;
use App\Http\Resources\DevelopmentPlanResource;
use App\Models\Competency;
use App\Models\DevelopmentPlan;
use App\Models\NotificationItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetencyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'competencies' => CompetencyResource::collection(Competency::orderBy('id')->get()),
            'developmentPlans' => DevelopmentPlanResource::collection(DevelopmentPlan::orderByDesc('readiness')->get()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $competency = Competency::create($this->attributes($request));
        NotificationItem::raise("New competency added: {$competency->name}", 'In-App', 'competency');

        return response()->json(['data' => new CompetencyResource($competency)], 201);
    }

    public function update(Request $request, Competency $competency): JsonResponse
    {
        $competency->update($this->attributes($request));

        return response()->json(['data' => new CompetencyResource($competency)]);
    }

    public function destroy(Competency $competency): JsonResponse
    {
        $competency->delete();

        return response()->json(['data' => ['id' => $competency->id]]);
    }

    /** Validate the API payload and map current/required to the *_level columns. */
    private function attributes(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['required', 'string', 'max:60'],
            'current' => ['required', 'integer', 'between:1,5'],
            'required' => ['required', 'integer', 'between:1,5'],
        ]);

        return [
            'name' => $data['name'],
            'category' => $data['category'],
            'current_level' => $data['current'],
            'required_level' => $data['required'],
        ];
    }
}
