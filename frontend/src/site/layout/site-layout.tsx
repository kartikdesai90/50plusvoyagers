'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/site/layout/site-footer';
import { SiteHeader } from '@/site/layout/site-header';
import { useContentGuard } from '@/site/layout/use-content-guard';
import { useSiteMotion } from '@/site/motion/use-site-motion';
import type { SiteSettings } from '@/site/types/settings';

/**
 * The public area's chrome.
 *
 * The settings arrive as a prop rather than being fetched here: this is a client
 * component — it needs the pathname to rebuild the motion layer — and the footer
 * inside it has to be in the first response for a crawler to read the business's
 * telephone number. So the route group's layout, which is a server component,
 * does the fetching and hands the result down.
 */
export function SiteLayout({
    settings,
    children,
}: {
    settings: SiteSettings;
    children: ReactNode;
}) {
    /*
     * The path alone, as before: a query string never changes which sections
     * are on the page, so it must not retrigger the choreography. `usePathname`
     * gives exactly that and nothing else, which is what the old
     * `url.split('?')[0]` was working to produce.
     */
    const pathname = usePathname();

    /* Rebuild the choreography whenever a new page's sections mount. */
    useSiteMotion(pathname);

    /*
     * The public site only. The admin panel is outside this layout and stays
     * as it is on purpose — an editor pasting a quote into a feedback form is
     * the job, not something to defend against.
     */
    useContentGuard();

    return (
        <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter settings={settings} />
        </div>
    );
}
