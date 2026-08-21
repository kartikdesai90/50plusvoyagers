import 'server-only';

import { laravelOrigin } from '@/site/data/origin';
import type { Band } from '@/site/types/band';
import type { Feedback } from '@/site/types/feedback';
import type { GalleryPhoto } from '@/site/types/gallery';
import type { JournalCard } from '@/site/types/journal';
import type { WhoWeAreCard } from '@/site/types/who-we-are';
import type { WhyUs } from '@/site/types/why-us';

/**
 * The homepage's editable content, fetched from Laravel while the page renders.
 *
 * `server-only` is load-bearing. This module holds the address Laravel answers
 * on, which is an internal one, and importing it from a client component would
 * put that address in the browser bundle. The import makes that a build error
 * rather than something to notice in production.
 *
 * Fetched during the server render, never after boot, for the same reason the
 * Inertia controller resolved these in the request: a homepage whose hero
 * arrived after hydration is a homepage whose main image no crawler ever sees.
 */

export type HomeContent = {
    /** Active hero slides, already in display order. */
    hero: Band[];
    /** Active banner bands, already in display order. */
    banners: Band[];
    /** Active "Who we are" cards, already in display order. */
    values: WhoWeAreCard[];
    /** The "Why travel with us" band, or null where none has been written. */
    why: WhyUs | null;
    /** Active written feedback, already in display order. */
    toasts: Feedback[];
    /** Active filmed feedback, already in display order. */
    films: Feedback[];
    /** Active photographs, already in display order and already capped. */
    gallery: GalleryPhoto[];
    /** The three published articles the journal row shows. */
    articles: JournalCard[];
};

const EMPTY: HomeContent = {
    hero: [],
    banners: [],
    values: [],
    why: null,
    toasts: [],
    films: [],
    gallery: [],
    articles: [],
};

const origin = laravelOrigin;

export async function fetchHomeContent(): Promise<HomeContent> {
    try {
        const response = await fetch(`${origin}/api/site/home`, {
            headers: { Accept: 'application/json' },
            /*
             * An editor changing a hero slide expects to see it. Sixty seconds
             * is short enough that they do not doubt whether it saved, and long
             * enough that a burst of traffic does not become a burst of queries.
             */
            next: { revalidate: 60 },
        });

        if (!response.ok) {
            throw new Error(`Laravel answered ${response.status}`);
        }

        return (await response.json()) as HomeContent;
    } catch (error) {
        /*
         * The homepage falls back to the content written into the front end
         * when a set comes back empty — that is what `fallbackHero` and the
         * rest are for. So an unreachable API costs the editor's changes, not
         * the page: a visitor still gets a complete homepage. Loudly logged,
         * because a site quietly serving placeholder content looks fine.
         */
        console.error('[site] homepage content could not be fetched:', error);

        return EMPTY;
    }
}
