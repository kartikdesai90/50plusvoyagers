import type { MetadataRoute } from 'next';

import { groupTourPath, paths } from '@/routes/paths';
import { tours } from '@/site/data/tours';
import { siteUrl } from '@/site/seo/site-url';

/**
 * The addresses worth crawling.
 *
 * Every public page, now that every public page answers for itself. This file
 * listed the homepage alone while `proxy.ts` sent the rest back to it with a
 * 307 — a sitemap that names a redirect claims it is canonical content and is
 * contradicted the moment a crawler follows it, and sitemaps that disagree with
 * the server get distrusted whole rather than line by line.
 *
 * Taken from `paths.ts` rather than written out again. The two would drift, and
 * a sitemap naming an address that no longer routes is the same broken promise
 * as before, arrived at more slowly.
 *
 * The two `:slug` routes are treated differently because their addresses are
 * known differently. Group tours come from a static catalogue in the tree and
 * `dynamicParams = false` makes that list exhaustive — the same list the router
 * will answer on, so naming them here cannot promise a 404. Journal posts are
 * fetched per request, so their slugs are not knowable at build time; listing
 * them means fetching them, which is worth doing and is the next thing to add
 * rather than something to guess at from this file.
 */

/**
 * The static public pages, homepage first.
 *
 * Homepage anchors are excluded: `#trips` and its siblings are parts of `/`,
 * and a fragment is not a separate address to a crawler. So are the `:slug`
 * patterns, which are templates rather than pages.
 */
const PUBLIC_PAGES = [
    paths.about,
    paths.groupTours,
    paths.giftHolidays,
    paths.membership,
    paths.workshops,
    paths.blog,
    paths.gallery,
    paths.contact,
    paths.privacy,
    paths.terms,
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
    const origin = siteUrl();

    /*
     * Stamped at build time rather than per request. The content is editable,
     * but a `lastModified` that moves on every crawl teaches Google the signal
     * means nothing; a deploy is the honest granularity for pages whose shape
     * changes when the code does.
     */
    const lastModified = new Date();

    return [
        {
            url: `${origin}/`,
            lastModified,
            changeFrequency: 'weekly',
            /** The page the site is about, and the only one given top billing. */
            priority: 1,
        },
        ...PUBLIC_PAGES.map((path) => ({
            url: `${origin}${path}`,
            lastModified,
            /*
             * Monthly, against the homepage's weekly. These are the standing
             * pages — what the trips are, what membership means, the terms —
             * and they change when the business does, not when a banner is
             * swapped. Claiming otherwise spends crawl budget re-reading text
             * that has not moved.
             */
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        })),
        ...tours.map((tour) => ({
            url: `${origin}${groupTourPath(tour.slug)}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            /*
             * Below the listing pages that link to them. A tour page is the
             * most specific thing here and the likeliest destination from a
             * search, but `/group-tours` is the one that stays useful when a
             * particular departure sells out.
             */
            priority: 0.7,
        })),
    ];
}
