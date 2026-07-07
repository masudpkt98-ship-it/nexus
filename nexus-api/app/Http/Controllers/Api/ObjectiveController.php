<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ObjectiveResource;
use App\Models\Objective;

class ObjectiveController extends Controller
{
    public function index()
    {
        return ObjectiveResource::collection(
            Objective::with(['owner', 'keyResults'])->orderBy('id')->get()
        );
    }
}
