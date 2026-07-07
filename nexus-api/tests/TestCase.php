<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Log in a seeded demo user (password "nexus") and return an auth-header array. */
    protected function authAs(string $email): array
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'nexus',
        ])->json('token');

        return ['Authorization' => "Bearer {$token}"];
    }
}
