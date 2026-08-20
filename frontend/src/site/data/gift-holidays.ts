/**
 * Gift Holidays — private, custom-planned trips, usually booked by adult
 * children for their parents. Same shape rules as the tour catalogue: every
 * rendered value lives here so the page can be handed over to a CMS untouched.
 */

const img = (name: string) => `/images/home/${name}.webp`;

export type GiftPackage = {
    slug: string;
    title: string;
    duration: string;
    price: string;
    places: string[];
    summary: string;
    image: string;
};

export const giftPackages: GiftPackage[] = [
    {
        slug: 'coorg',
        title: 'Coorg: Coffee Country',
        duration: '2 nights / 3 days',
        price: '₹19,000 per person',
        places: ['Madikeri', 'Coffee estates', 'Abbey Falls'],
        summary:
            'A plantation stay in the hills above Madikeri, with estate walks, a private car throughout and all meals taken care of.',
        image: img('value-unhurried-pace'),
    },
    {
        slug: 'chikmagalur',
        title: 'Chikmagalur & the Hoysala Temples',
        duration: '2 nights / 3 days',
        price: '₹18,000 per person',
        places: ['Chikmagalur', 'Belur', 'Halebidu'],
        summary:
            'Coffee country paired with the finest stone carving in the south, at a pace that leaves the afternoons free.',
        image: img('value-kindred-company'),
    },
    {
        slug: 'kerala-houseboat',
        title: 'Kerala Houseboat & Tea Gardens',
        duration: '3 nights / 4 days',
        price: '₹17,000 per person',
        places: ['Alleppey', 'Munnar', 'Kochi'],
        summary:
            'A private houseboat on the backwaters, a night in the tea hills and old Kochi at the end. Our most-gifted holiday.',
        image: img('kerala-backwaters'),
    },
    {
        slug: 'ujjain-temples',
        title: 'Ujjain & Omkareshwar',
        duration: '2 nights / 3 days',
        price: '₹9,500 per person',
        places: ['Ujjain', 'Omkareshwar', 'Mahakaleshwar'],
        summary:
            'A short pilgrimage with darshan arranged in advance, seated wherever possible, and no long queues in the sun.',
        image: img('value-fully-hosted'),
    },
    {
        slug: 'kerala-grand',
        title: 'Kerala: The Grand Tour',
        duration: '6 nights / 7 days',
        price: '₹32,000 per person',
        places: ['Kochi', 'Munnar', 'Thekkady', 'Alleppey', 'Kovalam'],
        summary:
            'The full length of the state, from the spice hills to the southern beaches, with a rest day built in halfway.',
        image: img('paro-valley'),
    },
    {
        slug: 'singapore-kuala-lumpur',
        title: 'Singapore & Kuala Lumpur',
        duration: '5 nights / 6 days',
        price: 'On request',
        places: ['Singapore', 'Sentosa', 'Kuala Lumpur'],
        summary:
            'A first trip abroad made easy: short flights, English everywhere, wheelchair-friendly cities and a host on call.',
        image: img('cappadocia'),
    },
];

export const giftPromises = [
    {
        title: 'Leisurely by design',
        body: 'One place a day, late starts and a rest built into every afternoon. Nothing is scheduled before nine.',
    },
    {
        title: 'Senior-friendly throughout',
        body: 'Hotels with lifts and walk-in showers, cars with a low step, and ground-floor rooms wherever we can get them.',
    },
    {
        title: 'Diet and care',
        body: 'Tell us about the medicines, the sugar, the salt, the knees. We plan the meals and the walking around all of it.',
    },
    {
        title: 'Door to door',
        body: 'Pick-up and drop at home, a single point of contact for the family, and a call after they land.',
    },
];

export const giftSteps = [
    {
        title: 'Tell us about them',
        body: 'A short call about where they have always wanted to go, how they travel, and what they can comfortably manage.',
    },
    {
        title: 'We plan it privately',
        body: 'An itinerary built for two or four, not a coachload — hotels, cars, meals and pacing chosen for them.',
    },
    {
        title: 'You gift it',
        body: 'We send a printed gift card with the itinerary inside, in your name, ready for the birthday or the anniversary.',
    },
    {
        title: 'We host the trip',
        body: 'They travel; you get updates. A tour host is reachable from the moment they leave home to the moment they return.',
    },
];
