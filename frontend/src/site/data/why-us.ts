import { whyImage, whyPoints } from '@/site/data/home';
import type { WhyUs } from '@/site/types/why-us';

/**
 * The "Why travel with us" band as the design ships it, for a site with none
 * stored.
 *
 * Not a second copy of the content: it is built from the same constants the
 * static homepage always used, and the seeder writes exactly the same words
 * into the database. What it buys is a homepage that still renders on a fresh
 * install, before anyone has signed in to the admin — the same bargain
 * `fallbackHero` makes, for the same reason.
 */
export const fallbackWhyUs: WhyUs = {
    points: whyPoints,
    button: { text: 'See upcoming trips', url: '#trips' },
    image: { url: whyImage.src, alt: whyImage.alt },
    caption: {
        heading: 'Small groups of 12–16',
        text: 'Big enough for friends, small enough that everyone belongs.',
    },
};
