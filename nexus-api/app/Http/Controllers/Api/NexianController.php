<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class NexianController extends Controller
{
    /**
     * Bulk-provision login accounts for the Nexian (KPI Partner) team.
     * Email = "{NPK}@nexus.co", password = the NPK. Scoped by unit/directorate.
     * NIK starting with 9 is skipped (non-organic).
     */
    public function provision(Request $request): JsonResponse
    {
        $data = $request->validate([
            'members' => ['required', 'array'],
            'members.*.npk' => ['required', 'string'],
            'members.*.name' => ['required', 'string'],
            'members.*.role' => ['nullable', 'string'],
            'members.*.unit' => ['nullable', 'string'],
            'members.*.directorate' => ['nullable', 'string'],
        ]);

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($data['members'] as $m) {
            $npk = trim((string) $m['npk']);
            if ($npk === '' || str_starts_with($npk, '9')) {
                $skipped++;
                continue;
            }

            $email = $npk.'@nexus.co';
            $role = preg_match('/manajemen/i', $m['role'] ?? '') ? 'KPI Partner Manajemen' : 'KPI Partner';
            $initials = collect(preg_split('/\s+/', trim($m['name'])))
                ->filter()->map(fn ($w) => mb_substr($w, 0, 1))->take(2)->implode('');

            $user = User::where('email', $email)->first();

            $profile = [
                'name' => $m['name'],
                'role' => $role,
                'title' => $role,
                'avatar' => mb_strtoupper($initials ?: 'N'),
                'npk' => $npk,
                'unit' => $m['unit'] ?? null,
                'directorate' => $m['directorate'] ?? null,
            ];

            if ($user) {
                // Update profile/scope only — never reset a password the user changed.
                $user->fill($profile)->save();
                $updated++;
            } else {
                User::create([
                    ...$profile,
                    'email' => $email,
                    'password' => Hash::make($npk),
                    'must_change_password' => true, // force change on first login
                    'email_verified_at' => now(),
                ]);
                $created++;
            }
        }

        return response()->json([
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'total' => $created + $updated,
        ]);
    }
}
