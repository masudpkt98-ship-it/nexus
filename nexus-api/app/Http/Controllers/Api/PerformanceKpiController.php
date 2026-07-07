<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PerformanceKpiResource;
use App\Models\PerformanceKpi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceKpiController extends Controller
{
    public function index()
    {
        return PerformanceKpiResource::collection(
            PerformanceKpi::orderByDesc('weight')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        // Create first, then derive a stable, unique code from the new id.
        $kpi = PerformanceKpi::create($this->attributes($request) + ['code' => 'TEMP-'.uniqid()]);
        $kpi->update(['code' => 'KPI-'.str_pad((string) $kpi->id, 3, '0', STR_PAD_LEFT)]);

        return response()->json(['data' => new PerformanceKpiResource($kpi)], 201);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $kpi = PerformanceKpi::where('code', $code)->firstOrFail();
        $kpi->update($this->attributes($request));

        return response()->json(['data' => new PerformanceKpiResource($kpi)]);
    }

    public function destroy(string $code): JsonResponse
    {
        $kpi = PerformanceKpi::where('code', $code)->firstOrFail();
        $kpi->delete();

        return response()->json(['data' => ['id' => $code]]);
    }

    private function attributes(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'level' => ['required', 'in:Corporate,Department,Individual'],
            'weight' => ['required', 'integer', 'between:0,100'],
            'target' => ['required', 'numeric', 'min:0'],
            'actual' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:20'],
        ]);
        $data['unit'] = $data['unit'] ?? '';

        return $data;
    }
}
