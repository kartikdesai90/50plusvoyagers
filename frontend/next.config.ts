import type { NextConfig } from 'next';

/**
 * The Laravel application, as this process reaches it.
 *
 * Server-side only. The browser never sees this address — every request a
 * browser makes goes to Next, which forwards it on. That is deliberate and is
 * explained under `rewrites` below.
 */
const backend = process.env.LARAVEL_ORIGIN ?? 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
    reactStrictMode: true,

    /**
     * Everything Laravel still owns, served through this origin.
     *
     * This is not a convenience. The admin panel authenticates with a Laravel
     * session cookie and a matching `XSRF-TOKEN`, and both are same-origin
     * cookies. If the browser called Laravel on its own port they would be
     * cross-site: the session cookie would need `SameSite=None; Secure`, the
     * CSRF check would need a stateful-domain list, and a signed-in editor
     * would be one browser privacy default away from being signed out. Passing
     * the requests through Next keeps the whole application on one origin, so
     * the cookie rules that already worked keep working unchanged.
     *
     * `/images` and `/storage` come through for a smaller reason: the pictures
     * an editor uploads and the ones shipped with the site live on Laravel's
     * disk, and copying them here would leave two sources of truth for a file.
     */
    async rewrites() {
        return [
            { source: '/api/:path*', destination: `${backend}/api/:path*` },
            { source: '/storage/:path*', destination: `${backend}/storage/:path*` },
            { source: '/images/:path*', destination: `${backend}/images/:path*` },
            { source: '/favicon.ico', destination: `${backend}/favicon.ico` },
            { source: '/robots.txt', destination: `${backend}/robots.txt` },
        ];
    },
};

export default nextConfig;
