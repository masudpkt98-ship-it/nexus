<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Production bootstrap — ONLY the admin account (no demo data). Idempotent
 * (firstOrCreate), so it is safe to run on every deploy: it creates the admin
 * on a fresh database and never touches an existing one (a changed password
 * survives redeploys). Initial password comes from ADMIN_PASSWORD (falls back
 * to "nexus") and MUST be changed on first login.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@nexus.co'],
            [
                'name' => 'Admin Nexus',
                'role' => 'Administrator',
                'title' => 'System Administrator',
                'avatar' => 'AN',
                'password' => Hash::make(env('ADMIN_PASSWORD', 'nexus')),
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
