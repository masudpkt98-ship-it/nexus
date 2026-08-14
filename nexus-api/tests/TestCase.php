<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Log in a seeded demo user (password "nexus") and return an auth-header array. */
    protected function authAs(string $email): array
    {
        // Drop whoever the guard resolved for an earlier request. The auth guard
        // is a singleton for the whole test process, so a second authAs() in one
        // test would otherwise keep acting as the first user — the bearer token
        // changes but $request->user() does not, which fails silently.
        $this->app['auth']->forgetGuards();

        $token = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'nexus',
        ])->json('token');

        return ['Authorization' => "Bearer {$token}"];
    }
}
