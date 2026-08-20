import { NextResponse, type NextRequest } from 'next/server';

/**
 * The public site, held back to the homepage.
 *
 * Only the homepage is open. Every other public address sends the visitor to
 * it rather than answering — the pages are finished and still in the tree, but
 * they are not being shown yet.
 *
 * Done here rather than in the pages themselves for two reasons. One file is
 * one thing to undo: deleting this file, or emptying the list below, opens the
 * site again with nothing else to find and revert. And a redirect issued before
 * routing never renders the page it is turning away, so a held-back address
 * costs a lookup rather than a fetch and a render.
 *
 * What is deliberately NOT held back:
 *
 *   /admin      the panel, which has to keep working — editors are still
 *               filling the site in, which is the reason the front is shut
 *   /api        the data both the panel and the homepage read
 *   /storage    uploaded files, /images the ones shipped with the design
 *   /_next      the framework's own assets, without which nothing renders
 *
 * Navigation still links to the held-back pages. That is intentional and was
 * asked for: the header and footer are the finished design, and a visitor who
 * follows one simply arrives back at the homepage.
 */

/** The one public address that answers for itself. */
const HOME = '/';

/**
 * Prefixes that must reach their handler untouched.
 *
 * Matched as path segments — `/admin` and everything under it, but never a
 * public page that merely starts with those letters.
 */
const ALWAYS_OPEN = ['/admin', '/api', '/storage', '/images', '/_next'];

/** Files served from the public root, which are addresses rather than pages. */
const OPEN_FILES = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === HOME) return NextResponse.next();

    if (OPEN_FILES.includes(pathname)) return NextResponse.next();

    const open = ALWAYS_OPEN.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (open) return NextResponse.next();

    /*
     * Temporary on purpose. A 308 is cached by the browser and by anything
     * between it and here, so a visitor who met one while the site was shut
     * could keep being sent home for as long as that cache lives — after the
     * pages are opened again. A 307 says "not now" rather than "not ever".
     */
    return NextResponse.redirect(new URL(HOME, request.url), 307);
}

export const config = {
    /*
     * Everything except the framework's own assets and anything that looks like
     * a file. The proxy checks the prefixes again itself — this matcher is the
     * cheap first pass, not the rule.
     */
    matcher: ['/((?!_next/static|_next/image|.*\\.[\\w]+$).*)'],
};
