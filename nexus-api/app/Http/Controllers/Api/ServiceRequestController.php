<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    public function index()
    {
        return ServiceRequestResource::collection(
            ServiceRequest::orderByDesc('id')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'requester' => ['required', 'string', 'max:255'],
            'priority' => ['nullable', 'in:Low,Medium,High,Critical'],
            'pic' => ['nullable', 'string'],
        ]);

        $data['code'] = 'SR-'.(ServiceRequest::withTrashed()->max('id') + 2041);
        $data['priority'] ??= 'Medium';
        $data['sla'] = 'Within SLA';
        $data['status'] = 'New';

        $req = ServiceRequest::create($data);

        return (new ServiceRequestResource($req))->response()->setStatusCode(201);
    }

    public function update(Request $request, ServiceRequest $service_request): ServiceRequestResource
    {
        // title and requester are editable in the form; leaving them out of the
        // rules silently discarded those edits.
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'requester' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:New,In Progress,Waiting Approval,Resolved'],
            'sla' => ['sometimes', 'in:Within SLA,At Risk,Breached'],
            'priority' => ['sometimes', 'in:Low,Medium,High,Critical'],
            'pic' => ['sometimes', 'string'],
        ]);

        $service_request->update($data);
        Audit::record('service_request.update', ['user' => $request->user(), 'target' => $service_request->code]);

        return new ServiceRequestResource($service_request);
    }

    public function destroy(Request $request, ServiceRequest $service_request): JsonResponse
    {
        $code = $service_request->code;
        $service_request->delete();
        Audit::record('service_request.delete', ['user' => $request->user(), 'target' => $code]);

        return response()->json(['data' => ['deleted' => $code]]);
    }
}
