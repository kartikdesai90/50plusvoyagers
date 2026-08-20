<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the admin API.
 *
 * The check is deliberately an identity check, not an attribute check: being an
 * admin *is* holding a {@see User}, because every row in that table can sign in
 * here and there is nothing to tell apart.
 *
 * The `web` guard is named explicitly rather than relying on the request's
 * ambient default, so adding a second guard later cannot quietly change who
 * this middleware evaluates.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('web');

        if (!$user instanceof User) {
            abort(Response::HTTP_FORBIDDEN, 'This account does not have admin access.');
        }

        return $next($request);
    }
}
