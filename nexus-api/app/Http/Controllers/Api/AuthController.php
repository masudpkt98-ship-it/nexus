<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Issue a Sanctum personal access token for valid credentials.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('nexus-web')->plainTextToken;

        Audit::record('auth.login', ['user' => $user, 'meta' => ['role' => $user->role]]);

        // The token also rides in an httpOnly cookie so JavaScript (and any XSS)
        // can't read it. AuthenticateWithCookie promotes it to the Bearer header
        // on subsequent requests. SameSite=Lax blocks cross-site CSRF; Secure in
        // production. The JSON `token` is kept for backward-compat but the web
        // client no longer persists it.
        $cookie = cookie(
            name: 'nexus_token',
            value: $token,
            minutes: 60 * 24 * 30,
            path: '/',
            domain: null,
            secure: app()->environment('production'),
            httpOnly: true,
            raw: false,
            sameSite: 'lax',
        );

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ])->withCookie($cookie);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        Audit::record('auth.logout', ['user' => $request->user()]);
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.'])
            ->withoutCookie('nexus_token');
    }

    /**
     * Change the authenticated user's password and clear the
     * "must change password" flag (used on first login).
     */
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->password = $data['password'];
        $user->must_change_password = false;
        $user->save();

        return response()->json([
            'user' => new UserResource($user),
            'message' => 'Password updated.',
        ]);
    }
}
