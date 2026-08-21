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
 * Owning it in Next also puts it beside `proxy.ts`, which is the thing that
 * actually decides what is reachable. Those two must agree, and the surest way
 * to keep them agreeing is to keep them in the same codebase — a crawl rule
 * describing pages the proxy turns away is a rule that wastes crawl budget on
 * redirects, which is how a site teaches Google that its addresses are worthless.
 *
 * The homepage is the only public page being shown, so it is the only thing
 * offered. The rest are `Disallow`ed rather than merely unlisted: they exist and
 * they answer — with a redirect home — and an unlisted-but-reachable address is
 * one a crawler will still try. Naming them costs one line each and spends that
 * budget on the page that has content instead.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            /*
             * The held-back pages, plus the two areas that were never public.
             * `/admin` and `/api` are not secrets — they are simply not pages,
             * and a crawler that indexes a login screen or a JSON endpoint is
             * spending its visit on something no one searches for.
             */
            disallow: [
                '/admin',
                '/api',
                '/about',
                '/group-tours',
                '/gift-holidays',
                '/membership',
                '/workshops',
                '/blog',
                '/contact',
                '/privacy-policy',
                '/terms-and-conditions',
            ],
        },
        sitemap: `${siteUrl()}/sitemap.xml`,
    };
}
