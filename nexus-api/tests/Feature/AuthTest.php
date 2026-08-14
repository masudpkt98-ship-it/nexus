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

    /**
     * A guest must get 401 even without `Accept: application/json`.
     *
     * The case above passes through getJson(), which sets that header — which is
     * why this went unnoticed: Laravel's default guest redirect calls
     * route('login'), and this API has no such route, so every request that did
     * NOT ask for JSON (a browser opening an API URL, an uptime probe, curl) got
     * a RouteNotFoundException and a 500.
     */
    public function test_guest_gets_401_not_a_login_redirect_without_a_json_accept_header(): void
    {
        $this->get('/api/competency')->assertStatus(401);

        $this->get('/api/competency', ['Accept' => 'text/html,application/xhtml+xml'])
            ->assertStatus(401);
    }

    public function test_public_surfaces_are_unaffected(): void
    {
        $this->get('/api/health')->assertOk();
        $this->get('/api/does-not-exist')->assertStatus(404);
    }
}
