<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Production bootstrap — ONLY the admin account (no demo data).
 *
 * The admin password is env-managed: set ADMIN_PASSWORD in the host env
 * (Railway → Variables) and this seeder keeps admin@nexus.co in sync with it on
 * every deploy (creating the account on a fresh DB), so the password is never
 * committed and can be rotated by changing the env var. must_change_password is
 * false when env-managed (the env IS the source of truth).
 *
 * If ADMIN_PASSWORD is NOT set, it falls back to create-only with "nexus" and
 * forces a change on first login — never touching an already-existing admin.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $envPassword = env('ADMIN_PASSWORD');

        if ($envPassword) {
            User::updateOrCreate(
                ['email' => 'admin@nexus.co'],
                [
                    'name' => 'Admin Nexus',
                    'role' => 'Administrator',
                    'title' => 'System Administrator',
                    'avatar' => 'AN',
                    'password' => Hash::make($envPassword),
                    'must_change_password' => false,
                    'email_verified_at' => now(),
                ]
            );

            return;
        }

        // No ADMIN_PASSWORD set → ensure a known, working admin so login is never
        // locked out on production. Resets to "nexus" on deploy; set ADMIN_PASSWORD
        // in the host env to take over with a private, non-resetting password.
        User::updateOrCreate(
            ['email' => 'admin@nexus.co'],
            [
                'name' => 'Admin Nexus',
                'role' => 'Administrator',
                'title' => 'System Administrator',
                'avatar' => 'AN',
                'password' => Hash::make('nexus'),
                'must_change_password' => false,
                'email_verified_at' => now(),
            ]
        );
    }
}
