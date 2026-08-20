import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';

import { AdminBoot } from '@/admin/auth/admin-boot';
import { RouteFallback } from '@/shared/ui/route-fallback';

/**
 * The panel is for staff, and no crawler has business indexing any of it.
 * Stated once here; every screen beneath inherits it.
 *
 * The name is read from the environment rather than from `siteConfig`, which
 * lives in the public area. The two areas do not import from each other — that
 * rule is what keeps the motion layer's GSAP and Lenis out of the bundle an
 * editor downloads — and one convenience import is how a boundary like that
 * stops being one.
 */
export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_APP_NAME || '50+ Voyagers',
    robots: { index: false, follow: false },
};

/**
 * The boundary for the whole admin area.
 *
 * `AdminBoot` stays outermost, exactly as it was outermost in the old route
 * tree: it mounts the auth provider and releases the marketing first-paint
 * cloak. Put a shell above it and the login screen loses the provider and the
 * cloak is never released — the panel would sit blank until the 2.5s failsafe.
 */
export default function AdminAreaLayout({ children }: { children: ReactNode }) {
    return (
        /*
         * The same boundary the old router had around the admin routes, in the
         * same place and with the same fallback. Next also requires it for its
         * own reason: screens beneath here read the query string, and a
         * component that does so has to sit inside a boundary or the whole page
         * gives up on being prerendered.
         *
         * The body is cloaked until first paint anyway, so a bare fallback here
         * reads as part of the normal load rather than a flash.
         */
        <Suspense fallback={<RouteFallback />}>
            <AdminBoot>{children}</AdminBoot>
        </Suspense>
    );
}
