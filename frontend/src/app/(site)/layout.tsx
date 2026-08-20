import type { ReactNode } from 'react';

import { fetchSettings } from '@/site/data/settings-content';
import { SiteLayout } from '@/site/layout/site-layout';

/**
 * The public area's chrome.
 *
 * A route group — the brackets keep it out of the URL — so every public page
 * shares one header, one footer and one motion layer without `/site` appearing
 * in a single address. This is what Inertia's persistent page layout did, and
 * for the same reason: `<main>` has to stay mounted across visits or the motion
 * layer's `main section` selector rebinds to elements that were never torn down.
 *
 * The admin panel is deliberately outside this group. It has its own shell and
 * does not run the motion layer at all.
 */
export default async function SiteAreaLayout({ children }: { children: ReactNode }) {
    /*
     * Fetched here rather than in the layout component itself, which is a client
     * component and cannot. Every public page renders this footer, so the
     * business's telephone number, address and profiles are in the first
     * response of every one of them.
     */
    const settings = await fetchSettings();

    return <SiteLayout settings={settings}>{children}</SiteLayout>;
}
