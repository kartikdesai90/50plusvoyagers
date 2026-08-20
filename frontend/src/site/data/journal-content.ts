import 'server-only';

import type { JournalCard, JournalPost } from '@/site/types/journal';

/**
 * The journal, fetched from Laravel while the page renders.
 *
 * `server-only` is load-bearing, for the same reason it is on the homepage's
 * content: this module holds the address Laravel answers on, which is an
 * internal one, and importing it from a client component would put that address
 * in the browser bundle. The import makes that a build error rather than
 * something to notice in production.
 *
 * Fetched during the server render, never after boot. An article whose prose
 * arrived after hydration is an article no crawler ever reads, which for a
 * journal is most of the point of having one.
 */

export type JournalIndex = {
    /** Every published article, in reading order. The first one leads. */
    posts: JournalCard[];
    /** Assembled from what has actually been filed, for the filter buttons. */
    categories: string[];
};

export type JournalArticle = {
    post: JournalPost;
    /** Up to three others, the same category first. */
    related: JournalCard[];
};

/**
 * Reached directly rather than through this application's own origin: a server
 * calling itself to reach a proxy to somewhere else is a hop that can only fail.
 */
const origin = process.env.LARAVEL_ORIGIN ?? 'http://127.0.0.1:8000';

/**
 * An editor publishing an article expects to see it. Sixty seconds is short
 * enough that they do not doubt whether it saved, and long enough that a burst
 * of traffic does not become a burst of queries. The same figure the homepage
 * uses, and for the same reason.
 */
const REVALIDATE = 60;

async function ask<T>(path: string): Promise<T | null> {
    try {
        const response = await fetch(`${origin}${path}`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: REVALIDATE },
        });

        /*
         * A 404 is an answer, not a failure: it is the server saying nothing is
         * published at that address. Returning null without the console noise
         * lets the page turn it into its own not-found, which is what it is.
         */
        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Laravel answered ${response.status}`);
        }

        return (await response.json()) as T;
    } catch (error) {
        /*
         * Loudly logged, because a journal quietly serving the content that
         * shipped with the design looks entirely fine from the outside. An
         * unreachable API costs the editor's articles, not the page.
         */
        console.error(`[site] ${path} could not be fetched:`, error);

        return null;
    }
}

/** Every published article. Null where Laravel could not be reached. */
export function fetchJournalIndex(): Promise<JournalIndex | null> {
    return ask<JournalIndex>('/api/site/blog');
}

/**
 * One article. Null both where nothing is published at that address and where
 * Laravel could not be reached — the caller falls back to the articles the
 * design ships with before deciding the page does not exist.
 */
export function fetchJournalPost(slug: string): Promise<JournalArticle | null> {
    return ask<JournalArticle>(`/api/site/blog/${encodeURIComponent(slug)}`);
}
