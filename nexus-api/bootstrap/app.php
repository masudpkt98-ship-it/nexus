<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'permission' => \App\Http\Middleware\EnsurePermission::class,
        ]);

        // Never redirect a guest to a login page — this backend has none (the UI
        // is the separate Next.js app, and the only web route is the welcome
        // page, which is public). Laravel's default guest redirect calls
        // route('login'), so any unauthenticated request that does NOT send
        // `Accept: application/json` — a browser opening an API URL, an uptime
        // probe, curl — raised RouteNotFoundException and returned 500 instead of
        // 401. Returning null leaves AuthenticationException to render as a 401.
        $middleware->redirectGuestsTo(fn () => null);

        // Promote the httpOnly nexus_token cookie to a Bearer header before the
        // Sanctum guard runs (so the token stays unreadable by client JS).
        $middleware->prependToGroup('api', \App\Http\Middleware\AuthenticateWithCookie::class);

        // The app is only reachable through the edge proxy (Caddy / Cloudflare),
        // so honor its X-Forwarded-* headers — needed so Laravel detects HTTPS,
        // sets Secure cookies, and logs the real client IP for rate limiting.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
