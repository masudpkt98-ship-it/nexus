<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Promote the httpOnly `nexus_token` cookie to a Bearer Authorization header so
 * Sanctum's token guard authenticates it — without the token ever being readable
 * by client JavaScript. An explicit Authorization header (legacy bearer clients)
 * still takes precedence.
 */
class AuthenticateWithCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Authorization')) {
            $token = $request->cookie('nexus_token');
            if (is_string($token) && $token !== '') {
                $request->headers->set('Authorization', 'Bearer '.$token);
            }
        }

        return $next($request);
    }
}
