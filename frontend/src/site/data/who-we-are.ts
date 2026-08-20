import { values } from '@/site/data/home';
import type { WhoWeAreCard } from '@/site/types/who-we-are';

/**
 * The "Who we are" cards as the design ships them, for a site with none stored.
 *
 * Not a second copy of the content: they are built from the same constants the
 * static homepage always used, and the seeder writes exactly the same four
 * cards into the database. What they buy is a homepage that still renders on a
 * fresh install, before anyone has signed in to the admin.
 *
 * Negative ids, as the fallback bands use, so nothing can mistake one of these
 * for a row that exists.
 */
export const fallbackWhoWeAre: WhoWeAreCard[] = values.map((value, index) => ({
    id: -(index + 1),
    title: value.title,
    body: value.body,
    image_url: value.src,
    /* The title, which is what the static markup announced these pictures as,
       and what the server derives for a stored card. */
    image_alt: value.title,
}));
