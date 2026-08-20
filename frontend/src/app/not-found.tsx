import type { Metadata } from 'next';

import { fetchSettings } from '@/site/data/settings-content';
import { SiteLayout } from '@/site/layout/site-layout';
import NotFoundPage from '@/site/pages/not-found';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

/* Kept out of the index: it is a real page to a person and nothing at all to a
   search engine. */
export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `This page could not be found — ${siteConfig.name}`,
        description: 'The page you are looking for does not exist or may have been moved.',
        noindex: true,
    });
}

/**
 * Any address the application does not answer on.
 *
 * This is Laravel's `Route::fallback` — the 404 a visitor got for an unknown
 * public URL, with the site's own header and footer around it rather than a
 * bare framework page. The chrome is applied here rather than inherited,
 * because Next resolves a not-found against the root layout and the site's
 * layout is a route group below it.
 *
 * An unknown address under `/admin` never reaches this: the panel has its own,
 * inside its own shell, for the same reason it always did.
 */
export default async function NotFound() {
    /* Fetched here for the same reason the route group's layout does it: this
       page is resolved against the root layout, so it gets no chrome — and no
       settings — from the group below it. */
    const settings = await fetchSettings();

    return (
        <SiteLayout settings={settings}>
            <NotFoundPage />
        </SiteLayout>
    );
}
