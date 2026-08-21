import type { MetadataRoute } from 'next';

import { siteUrl } from '@/site/seo/site-url';

/**
 * The addresses worth crawling.
 *
 * One entry, because one page is being shown. `proxy.ts` answers every other
 * public address with a 307 back here, and listing a redirect in a sitemap is
 * worse than listing nothing: it is a direct claim that the URL is canonical
 * content, contradicted the moment the crawler follows it. Sitemaps that
 * disagree with what the server does get distrusted as a whole, so the honest
 * one-line file is the one that helps.
 *
 * `/sitemap.xml` was already whitelisted in `proxy.ts`'s `OPEN_FILES` before
 * this file existed, so the path was reserved and answering 404. It answers now.
 *
 * When the rest of the site opens, this is one of the two files to revisit —
 * add the routes here and drop them from the `disallow` list in `robots.ts`.
 * `paths.ts` already names them all.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: `${siteUrl()}/`,
            /*
             * Stamped at build time rather than per request. The homepage's
             * content is editable, but a `lastModified` that moves on every
             * crawl teaches Google the signal means nothing; a deploy is the
             * honest granularity for a page whose shape changes when the code does.
             */
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
    ];
}
