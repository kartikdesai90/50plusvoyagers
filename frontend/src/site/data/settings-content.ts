import 'server-only';

import { withFallbacks } from '@/site/data/settings';
import type { SiteSettings } from '@/site/types/settings';

/**
 * The site's settings, fetched from Laravel while the page renders.
 *
 * `server-only` is load-bearing, for the same reason it is on the homepage's
 * content: this module holds the address Laravel answers on, which is an
 * internal one, and importing it from a client component would put that address
 * in the browser bundle.
 *
 * Fetched on the server, before anything renders. The footer's telephone number
 * and the document's own metadata are both built from this, and neither can
 * wait for hydration — a crawler that runs no JavaScript still has to read a
 * finished head.
 */

/**
 * Reached directly rather than through this application's own origin: a server
 * calling itself to reach a proxy to somewhere else is a hop that can only fail.
 */
const origin = process.env.LARAVEL_ORIGIN ?? 'http://127.0.0.1:8000';

/**
 * Longer than the homepage's minute. These change a few times a year, every
 * page renders them, and an editor who has just corrected a telephone number is
 * on the admin panel rather than watching the public footer.
 */
const REVALIDATE = 300;

/**
 * The settings, already filled in from the design wherever a value is missing.
 *
 * Never throws and never returns nothing: an unreachable API costs the editor's
 * changes, not the page. Loudly logged, because a site quietly serving the
 * content it shipped with looks entirely fine from the outside.
 */
export async function fetchSettings(): Promise<SiteSettings> {
    try {
        const response = await fetch(`${origin}/api/site/settings`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: REVALIDATE },
        });

        if (!response.ok) {
            throw new Error(`Laravel answered ${response.status}`);
        }

        return withFallbacks((await response.json()) as SiteSettings);
    } catch (error) {
        console.error('[site] settings could not be fetched:', error);

        return withFallbacks(null);
    }
}
