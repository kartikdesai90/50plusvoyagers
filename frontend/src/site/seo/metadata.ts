import type { Metadata } from 'next';

import { fetchSettings } from '@/site/data/settings-content';

/**
 * What a page tells a search engine about itself.
 *
 * This replaces the `<Seo>` component, which wrapped Inertia's `<Head>`. The
 * tags it produces are the same ones, in the same words — what has changed is
 * who writes them: Next resolves `metadata` on the server and puts it in the
 * document before anything renders, which is the job the SSR sidecar used to
 * do. A crawler that runs no JavaScript still reads the finished head.
 *
 * The canonical address was previously shared from Laravel, which was the only
 * party that knew the scheme and host the request arrived on. Next knows the
 * same thing, and `metadataBase` in the root layout is where it is told once.
 *
 * Asynchronous, because the defaults behind it are editable now: the site's
 * name, the description a page falls back to, the keywords and the picture a
 * shared link shows all come from the settings. Every page reaches this through
 * `generateMetadata`, and Next resolves it on the server before anything
 * renders — so a crawler running no JavaScript still reads a finished head.
 */

type SeoInput = {
    /** The complete title. No pattern is applied — what is passed is what is rendered. */
    title: string;
    /** One sentence. Falls back to the site's own description. */
    description?: string;
    /** Set on pages that exist for a person but have nothing to offer a search engine. */
    noindex?: boolean;
    /** This page's own address, root-relative. Resolved against `metadataBase`. */
    path?: string;
};

export async function pageMetadata({
    title,
    description,
    noindex = false,
    path,
}: SeoInput): Promise<Metadata> {
    const settings = await fetchSettings();

    const summary = description ?? settings.meta_description ?? '';
    /*
     * The page's own picture would go here if pages had one; until then every
     * shared link shows the site's. Left out entirely rather than defaulted to
     * something, because a broken `og:image` is worse than none — a card with a
     * missing picture in it looks like a broken site.
     */
    const image = settings.og_image_url ?? undefined;

    return {
        title,
        description: summary,
        keywords: settings.meta_keywords ?? undefined,
        alternates: path ? { canonical: path } : undefined,
        robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
        icons: settings.favicon_url ? { icon: settings.favicon_url } : undefined,

        /* What a link to this page looks like when it is shared. */
        openGraph: {
            type: 'website',
            siteName: settings.company_name,
            title,
            description: summary,
            url: path,
            images: image,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: summary,
            images: image,
        },
    };
}
