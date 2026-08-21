import 'server-only';

import { laravelOrigin } from '@/site/data/origin';
import type { GalleryPhoto } from '@/site/types/gallery';

/**
 * The gallery, fetched from Laravel while the page renders.
 *
 * `server-only` for the same reason the journal's content has it: this module
 * holds the address Laravel answers on, which is internal, and importing it
 * from a client component would put that address in the browser bundle. The
 * import turns that into a build error rather than something to spot in
 * production.
 *
 * Fetched during the server render rather than after boot. The photographs are
 * the page — one that filled in after hydration would be an empty grid to a
 * crawler, and an empty grid for a moment to everyone else.
 */

/** Every visible photograph, in the order editors put them in. */
type GalleryIndex = { photos: GalleryPhoto[] };

/**
 * Reached directly rather than through this application's own origin: a server
 * calling itself to reach a proxy to somewhere else is a hop that can only fail.
 */
const origin = laravelOrigin;

/**
 * An editor who uploads a photograph expects to see it. Sixty seconds is short
 * enough that they do not doubt whether it saved, and long enough that a burst
 * of traffic does not become a burst of queries. The figure the homepage and
 * the journal both use, and for the same reason.
 */
const REVALIDATE = 60;

/**
 * Every photograph. Null where Laravel could not be reached, which the page
 * turns into the gallery the design ships with.
 */
export async function fetchGallery(): Promise<GalleryPhoto[] | null> {
    try {
        const response = await fetch(`${origin}/api/site/gallery`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: REVALIDATE },
        });

        if (!response.ok) {
            throw new Error(`Laravel answered ${response.status}`);
        }

        const { photos } = (await response.json()) as GalleryIndex;

        return photos;
    } catch (error) {
        /*
         * Loudly logged, because a gallery quietly showing the pictures that
         * shipped with the design looks entirely fine from the outside. An
         * unreachable API costs the editor's photographs, not the page.
         */
        console.error('[site] /api/site/gallery could not be fetched:', error);

        return null;
    }
}
