/**
 * The site's public address, guaranteed to parse as a URL.
 *
 * A blank `NEXT_PUBLIC_SITE_URL` is the case worth guarding: hosting dashboards
 * let you create a variable and leave its value empty, and `''` slips past `??`
 * while still throwing `ERR_INVALID_URL`. Because the root layout calls this at
 * module scope to build `metadataBase`, that throw fails the entire build rather
 * than one route.
 *
 * Falling back to localhost keeps the build alive; it does not make the metadata
 * correct, so the miss is logged loudly enough to notice in a deploy log.
 *
 * Lifted out of the root layout because `robots.ts` and `sitemap.ts` need the
 * same answer. Three files agreeing on the origin by coincidence is how a
 * canonical tag ends up pointing somewhere the sitemap does not list — and a
 * sitemap whose URLs disagree with the canonicals is ignored wholesale.
 *
 * The trailing slash is stripped so callers can append a rooted path without
 * producing `https://host//sitemap.xml`.
 */
export function siteUrl(): string {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

    if (configured) {
        return configured.replace(/\/+$/, '');
    }

    console.warn(
        '[site] NEXT_PUBLIC_SITE_URL is unset or empty — canonical and og:url ' +
            'tags will resolve against localhost. Set it to the deployed origin.',
    );

    return 'http://localhost:3000';
}
