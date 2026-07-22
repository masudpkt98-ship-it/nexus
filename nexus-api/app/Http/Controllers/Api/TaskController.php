<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Activity;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['assignee', 'program']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }
        if ($request->filled('program')) {
            $query->whereHas('program', fn ($q) => $q->where('code', $request->string('program')));
        }

        return TaskResource::collection($query->orderByDesc('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:Backlog,In Progress,Review,Done'],
            'priority' => ['nullable', 'in:Low,Medium,High,Critical'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'program_id' => ['nullable', 'exists:programs,id'],
            'due_date' => ['nullable', 'date'],
            'checklist_total' => ['nullable', 'integer', 'min:0'],
            'checklist_done' => ['nullable', 'integer', 'min:0'],
            'tags' => ['nullable', 'array'],
            'category' => ['nullable', 'string', 'max:64'],
            'business_value' => ['nullable', 'string', 'max:64'],
            'effort_value' => ['nullable', 'integer', 'min:0'],
            'effort_unit' => ['nullable', 'in:Jam,Hari'],
            'requester' => ['nullable', 'string', 'max:255'],
            'sprint' => ['nullable', 'string', 'max:64'],
            'dependencies' => ['nullable', 'array'],
        ]);

        $data['code'] = 'T-'.(Task::withTrashed()->max('id') + 101);
        $data['status'] ??= 'Backlog';
        $data['priority'] ??= 'Medium';

        $task = Task::create($data);
        $this->log($request->user(), 'created task', $task->title);

        return (new TaskResource($task->load(['assignee', 'program'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Task $task): TaskResource
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:Backlog,In Progress,Review,Done'],
            'priority' => ['sometimes', 'in:Low,Medium,High,Critical'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'program_id' => ['nullable', 'exists:programs,id'],
            'due_date' => ['nullable', 'date'],
            'checklist_total' => ['sometimes', 'integer', 'min:0'],
            'checklist_done' => ['sometimes', 'integer', 'min:0'],
            'tags' => ['nullable', 'array'],
            'category' => ['nullable', 'string', 'max:64'],
            'business_value' => ['nullable', 'string', 'max:64'],
            'effort_value' => ['nullable', 'integer', 'min:0'],
            'effort_unit' => ['nullable', 'in:Jam,Hari'],
            'requester' => ['nullable', 'string', 'max:255'],
            'sprint' => ['nullable', 'string', 'max:64'],
            'dependencies' => ['nullable', 'array'],
        ]);

        $task->update($data);

        return new TaskResource($task->load(['assignee', 'program']));
    }

    /**
     * Move a task across the Kanban board.
     */
    public function updateStatus(Request $request, Task $task): TaskResource
    {
        $data = $request->validate([
            'status' => ['required', 'in:Backlog,In Progress,Review,Done'],
        ]);

        $task->update($data);
        $this->log($request->user(), 'moved task to '.$data['status'], $task->title);

        return new TaskResource($task->load(['assignee', 'program']));
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete(); // soft delete

        return response()->json(['message' => 'Task archived.']);
    }

    private function log(?User $user, string $action, string $target): void
    {
        Activity::create([
            'user_id' => $user?->id,
            'actor' => $user ? $this->shortName($user->name) : 'System',
            'action' => $action,
            'target' => $target,
            'type' => 'task',
        ]);
    }

    private function shortName(string $name): string
    {
        $parts = explode(' ', trim($name));
        $first = $parts[0] ?? $name;
        $lastInitial = isset($parts[1]) ? strtoupper(substr($parts[1], 0, 1)).'.' : '';

        return trim($first.' '.$lastInitial);
    }
}
