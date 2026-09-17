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

    /**
     * The picture a shared link to *this* page shows.
     *
     * Falls back to the site's own. A page that has one — a tour, an article —
     * passes it; the pages that are the site itself do not, and get the site's
     * as they always did.
     */
    image?: string | null;

    /**
     * What a shared card says, where an editor wrote something different from
     * the search title.
     *
     * They are genuinely two jobs: a search title is written for a results page
     * and is usually suffixed with the company name, while a share title is
     * read on its own inside a card. The admin stores both, so both are
     * honoured; either falling back to the search text where it is empty.
     */
    ogTitle?: string | null;
    ogDescription?: string | null;
};

export async function pageMetadata({
    title,
    description,
    noindex = false,
    path,
    image,
    ogTitle,
    ogDescription,
}: SeoInput): Promise<Metadata> {
    const settings = await fetchSettings();

    const summary = description ?? settings.meta_description ?? '';

    /*
     * This page's own picture where it has one, the site's otherwise.
     *
     * Pages used to have no way to pass one, so every shared tour and every
     * shared article advertised the same site-wide image — an editor could
     * upload a share image in the admin, see it stored, and never find it
     * anywhere. Left undefined when neither exists rather than defaulted to
     * something, because a broken `og:image` is worse than none: a card with a
     * missing picture in it looks like a broken site.
     *
     * Root-relative is correct here. `metadataBase` in the root layout is what
     * makes these absolute in the rendered tag, which is what a scraper needs —
     * building an absolute URL here would hardcode a host this layer does not
     * reliably know.
     */
    const shareImage = image ?? settings.og_image_url ?? undefined;

    const shareTitle = ogTitle || title;
    const shareDescription = ogDescription || summary;

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
            title: shareTitle,
            description: shareDescription,
            url: path,
            images: shareImage,
        },
        twitter: {
            card: 'summary_large_image',
            title: shareTitle,
            description: shareDescription,
            images: shareImage,
        },
    };
}
