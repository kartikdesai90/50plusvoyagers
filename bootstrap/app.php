<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        /*
         * Behind any TLS-terminating proxy the PHP process receives plain
         * HTTP, and only the `X-Forwarded-*` headers say the visitor arrived
         * over HTTPS. Without trusting them Laravel builds `http://` URLs and
         * marks the session cookie insecure, which the admin panel's cookie
         * authentication depends on getting right.
         *
         * Managed proxies are usually not addressable, so there is no IP range
         * to pin to; `'*'` is the documented configuration for this.
         */
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
                | Request::HEADER_X_FORWARDED_AWS_ELB,
        );

        /*
         * The web group is otherwise stock. It used to carry a middleware that
         * shared global props onto every Inertia response; there are no Inertia
         * responses now — Laravel answers with JSON and the front end owns the
         * document — so there is nothing left to share.
         *
         * What the group is still here for is the part the admin panel depends
         * on: session handling and CSRF verification for cookie-authenticated
         * requests.
         */
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
