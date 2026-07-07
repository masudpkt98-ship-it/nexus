<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProgramResource;
use App\Models\Program;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function index()
    {
        return ProgramResource::collection(
            Program::with('owner')->orderBy('id')->get()
        );
    }

    public function show(Program $program): ProgramResource
    {
        return new ProgramResource($program->load('owner'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'owner_id' => ['nullable', 'exists:users,id'],
            'status' => ['nullable', 'in:On Track,At Risk,Delayed,Completed'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'budget' => ['nullable', 'integer', 'min:0'],
            'spent' => ['nullable', 'integer', 'min:0'],
            'risk' => ['nullable', 'in:Low,Medium,High'],
            'milestones' => ['nullable', 'integer', 'min:0'],
            'milestones_done' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $data['code'] = 'PRG-'.str_pad((string) (Program::withTrashed()->max('id') + 1), 2, '0', STR_PAD_LEFT);

        $program = Program::create($data);

        return (new ProgramResource($program->load('owner')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Program $program): ProgramResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'owner_id' => ['nullable', 'exists:users,id'],
            'status' => ['sometimes', 'in:On Track,At Risk,Delayed,Completed'],
            'progress' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'budget' => ['sometimes', 'integer', 'min:0'],
            'spent' => ['sometimes', 'integer', 'min:0'],
            'risk' => ['sometimes', 'in:Low,Medium,High'],
            'milestones' => ['sometimes', 'integer', 'min:0'],
            'milestones_done' => ['sometimes', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $program->update($data);

        return new ProgramResource($program->load('owner'));
    }

    public function destroy(Program $program): JsonResponse
    {
        $program->delete();

        return response()->json(['message' => 'Program archived.']);
    }
}
