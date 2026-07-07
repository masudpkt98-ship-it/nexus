<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
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
        $data = $request->validate([
            'status' => ['sometimes', 'in:New,In Progress,Waiting Approval,Resolved'],
            'sla' => ['sometimes', 'in:Within SLA,At Risk,Breached'],
            'priority' => ['sometimes', 'in:Low,Medium,High,Critical'],
            'pic' => ['sometimes', 'string'],
        ]);

        $service_request->update($data);

        return new ServiceRequestResource($service_request);
    }
}
