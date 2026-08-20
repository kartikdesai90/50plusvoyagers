import { dividers, heroSlides } from '@/site/data/home';
import type { Band } from '@/site/types/band';

/**
 * The homepage's bands as the design ships them, for a site with none stored.
 *
 * Not a second copy of the content: these are built from the same constants the
 * static homepage always used, and the seeder writes exactly the same words
 * into the database. What they buy is a homepage that still renders on a fresh
 * install, before anyone has signed in to the admin — the alternative is a page
 * with no hero, which is a broken site rather than an empty one.
 */

const heroCopy = {
    label: 'Small-group travel for the 50+ explorer',
    heading: 'See the world like you *mean* it.',
    description:
        'Thoughtfully paced, expertly hosted journeys across India and the world, for people who are only just getting started.',
    button: { text: 'Browse the trip calendar', url: '#trips' },
    /* The words over the photograph, which the seeder writes into the lead
       band and which used to be printed straight into the markup. */
    caption: {
        label: 'Our voyagers · out there with us',
        heading: 'Travel together. Create stories that last.',
        text: 'Small groups, unhurried days, and friendships that outlast the trip.',
        button: { text: 'Explore our journeys', url: '#trips' },
    },
};

export const fallbackHero: Band[] = heroSlides.map((slide, index) => ({
    id: -(index + 1),
    media_url: slide.src,
    /* The heading, exactly as the server derives it from a stored band. */
    media_alt: heroCopy.heading,
    // The words belong to the first slide, exactly as they do when the bands
    // come from the database.
    label: index === 0 ? heroCopy.label : null,
    heading: heroCopy.heading,
    description: index === 0 ? heroCopy.description : null,
    button: index === 0 ? heroCopy.button : null,
    caption: index === 0 ? heroCopy.caption : null,
}));

export const fallbackBanners: Band[] = [dividers.adventure, dividers.sorted].map(
    (divider, index) => ({
        id: -(index + 1),
        media_url: divider.src,
        media_alt: divider.title,
        label: null,
        heading: divider.title,
        description: divider.body,
        button: { text: divider.cta.label, url: divider.cta.href },
        caption: null,
    }),
);
