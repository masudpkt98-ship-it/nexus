<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PerformanceKpiResource;
use App\Models\PerformanceKpi;

class PerformanceKpiController extends Controller
{
    public function index()
    {
        return PerformanceKpiResource::collection(
            PerformanceKpi::orderByDesc('weight')->get()
        );
    }
}
