import type { MetadataRoute } from 'next';

import { siteUrl } from '@/site/seo/site-url';

/**
 * What a crawler is allowed to ask for.
 *
 * This used to be Laravel's file, reached through a rewrite in
 * `next.config.ts`. That was one hop too many for something this consequential:
 * the copy in `public/robots.txt` says allow-all, but the deployed container was
 * answering `Disallow: /` — which is the single most expensive line a site can
 * serve, and it silently un-indexed everything. A file on a container's disk
 * cannot be reviewed here; this can.
 *
 * Owning it in Next also keeps it beside the routes it describes, so a crawl
 * rule and the page it names can be reviewed together. That mattered while
 * `proxy.ts` held the site back to the homepage and the two files had to agree;
 * it still matters, because this file and `sitemap.ts` make the same claims
 * about the same addresses and are the two places to change when that changes.
 *
 * The whole public site is open now, so all of it is offered. The pages that
 * used to be listed here were `Disallow`ed because they answered with a
 * redirect home and a crawler spending its budget on redirects is how a site
 * teaches Google its addresses are worthless. They render themselves now, so
 * the reason is gone with the gate that caused it.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            /*
             * The two areas that were never public. `/admin` and `/api` are not
             * secrets — they are simply not pages, and a crawler that indexes a
             * login screen or a JSON endpoint is spending its visit on
             * something no one searches for.
             */
            disallow: ['/admin', '/api'],
        },
        sitemap: `${siteUrl()}/sitemap.xml`,
    };
}
