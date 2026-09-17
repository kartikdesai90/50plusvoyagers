import type { Metadata } from 'next';
import { Hanken_Grotesk, Spectral } from 'next/font/google';
import type { ReactNode } from 'react';

import { siteConfig } from '@/site/config/site';
import { siteUrl } from '@/site/seo/site-url';
import '@/styles/app.css';

/**
 * The two typefaces, self-hosted.
 *
 * They used to come from `fonts.bunny.net` behind a stylesheet link, which cost
 * the first paint a DNS lookup, a TLS handshake and a render-blocking round trip
 * before a single weight began downloading — and left the faces on the browser's
 * default `font-display`, so text waited on them invisibly.
 *
 * `next/font` copies the files into the build and emits the `@font-face` rules
 * inline, so there is no third party in the critical path and no external
 * request to block on. Same families, same weights, same look.
 *
 * It matters beyond the network too: the intro choreography waits on
 * `document.fonts.ready` before it measures the headline for splitting, so how
 * quickly these resolve decides how quickly the page is allowed to appear.
 */
const sans = Hanken_Grotesk({
    subsets: ['latin'],
    /* Variable font — one file covers the 400–800 the design uses. */
    weight: 'variable',
    display: 'swap',
    variable: '--font-hanken-grotesk',
});

const serif = Spectral({
    subsets: ['latin'],
    /* Not a variable font, so the design's weights are named one by one. */
    weight: ['400', '500', '600'],
    style: ['normal', 'italic'],
    display: 'swap',
    variable: '--font-spectral',
});

/**
 * The document both areas render into.
 *
 * This is what `site.blade.php` and `app.blade.php` used to be, merged: the two
 * shells only ever differed in which bundle they loaded and whether they left
 * the head to the page, and neither of those is a decision anyone makes by hand
 * any more. Next code-splits per route, and the head is `metadata`.
 *
 * No `<title>` is set here for the same reason the site shell deliberately had
 * none: every page writes its own, and a fixed one here would be the first in
 * the document and therefore the one a crawler reads.
 */
export const metadata: Metadata = {
    /*
     * The base every canonical and `og:url` is resolved against. Laravel used
     * to share this per request — it was the only party that knew the scheme
     * and host. Next needs telling once, and in production that is the site's
     * real address rather than whatever host header arrived.
     *
     * `??` alone is not enough of a guard: a host that defines the variable but
     * leaves it blank hands us `''`, which is a miss for `??` but still fails
     * `new URL()` — and it fails at module scope, so it takes the whole build
     * down rather than one page. Trim and test for truthiness instead.
     */
    metadataBase: new URL(siteUrl()),
    description: siteConfig.description,
    icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html
            lang="en"
            /*
             * Tells the router the smooth scrolling in the stylesheet is
             * deliberate. Without it Next warns on every navigation, because it
             * cannot tell an intended `scroll-behavior: smooth` from one
             * inherited by accident — and it disables its own instant scroll
             * restoration to be safe, which makes a route change animate to the
             * top rather than arrive there.
             */
            data-scroll-behavior="smooth"
            className={`${sans.variable} ${serif.variable}`}
        >
            <head>
                {/*
                 * Cloak the first paint so the intro timeline owns it. Added
                 * from JS (never as a static attribute) so the page is always
                 * visible without scripting, and released by a failsafe if the
                 * bundle never boots.
                 *
                 * It matters here for the reason it mattered on the server-
                 * rendered shell: the finished page is already painted, so
                 * without the cloak the visitor would see it settled for a
                 * frame before the motion layer takes it back to its hidden
                 * state.
                 */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `document.documentElement.classList.add('voy-boot');setTimeout(function(){document.documentElement.classList.remove('voy-boot');},2500);`,
                    }}
                />
            </head>
            <body className="font-sans">{children}</body>
        </html>
    );
}
