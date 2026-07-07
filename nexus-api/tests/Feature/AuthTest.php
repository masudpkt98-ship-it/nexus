<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $this->seed();

        $this->postJson('/api/auth/login', [
            'email' => 'arif.wibowo@nexus.co',
            'password' => 'nexus',
        ])->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->seed();

        $this->postJson('/api/auth/login', [
            'email' => 'arif.wibowo@nexus.co',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_protected_route_requires_authentication(): void
    {
        $this->getJson('/api/competency')->assertStatus(401);
    }
}
