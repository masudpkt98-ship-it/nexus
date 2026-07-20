<?php

namespace App\Http\Middleware;

use App\Support\Audit;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    /**
     * Enforce RBAC: the authenticated user must hold the given permission.
     * Usage on a route: ->middleware('permission:tasks.manage')
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasPermission($permission)) {
            Audit::record('access.denied', [
                'user' => $user,
                'target' => $permission,
                'meta' => ['path' => $request->path(), 'method' => $request->method()],
            ]);

            return response()->json([
                'message' => 'This action is unauthorized for your role.',
                'required_permission' => $permission,
                'role' => $user?->role,
            ], 403);
        }

        return $next($request);
    }
}
