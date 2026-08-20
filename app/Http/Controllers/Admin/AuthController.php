<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use App\Http\Resources\Admin\AdminUserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Session-cookie authentication for the admin SPA.
 *
 * These endpoints sit in the `web` middleware group so they get session state
 * and CSRF protection for free; the SPA's axios client is already configured
 * to send the XSRF token.
 */
class AuthController extends Controller
{
    /**
     * Log an administrator in.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        // Prevent session fixation.
        $request->session()->regenerate();

        $user = $request->user('web');

        // Recorded after the session is settled, so the timestamp only ever
        // reflects a sign-in that actually completed.
        $user?->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'data' => new AdminUserResource($user),
        ]);
    }

    /**
     * Return the currently authenticated administrator.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new AdminUserResource($request->user()),
        ]);
    }

    /**
     * Log the administrator out and destroy the session.
     */
    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }
}
