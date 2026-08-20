/**
 * Homepage content. Kept separate from the section components so copy and
 * imagery can later be swapped for API data without touching any markup.
 */

const img = (name: string) => `/images/home/${name}.webp`;

export type HeroSlide = { src: string; alt: string };

export const heroSlides: HeroSlide[] = [
    {
        src: img('hero-mountain-lake'),
        alt: '50+ Voyagers guests together on tour, arms raised by a mountain lake',
    },
    { src: img('pangong-lake'), alt: '50+ Voyagers guests by the water on a group departure' },
    { src: img('paro-valley'), alt: '50+ Voyagers guests walking together through a valley' },
    { src: img('kerala-backwaters'), alt: '50+ Voyagers guests on a slow morning cruise' },
    { src: img('cappadocia'), alt: '50+ Voyagers guests watching the sunrise together' },
];

export type Value = { title: string; body: string; src: string };

export const values: Value[] = [
    {
        title: 'Small groups',
        body: "12–16 fellow travellers, never a faceless crowd. You'll know everyone's name by day two.",
        src: img('value-small-groups'),
    },
    {
        title: 'Unhurried pace',
        body: 'Comfortable stays and time to actually savour a place, not sprint through it.',
        src: img('value-unhurried-pace'),
    },
    {
        title: 'Fully hosted',
        body: 'A dedicated tour manager handles the logistics, so all you carry is your curiosity.',
        src: img('value-fully-hosted'),
    },
    {
        title: 'Kindred company',
        body: "Everyone's in the same season of life: same stories, same spirit, same sense of adventure.",
        src: img('value-kindred-company'),
    },
];

/** Rendered as styled wordmarks rather than logo files, as in the reference. */
export type PressLogo = { name: string; className: string };

/**
 * The nine mastheads listed on 50plusvoyagers.com. The live site repeats Times
 * of India twice (two different logo files); it is deduped here. Sizes are
 * fluid so the marks stay optically matched in the 3x3 grid from 320px up.
 */
export const pressLogos: PressLogo[] = [
    {
        name: 'Outlook Money',
        className:
            'text-[clamp(12px,1.9vw,18px)]/[1.2] font-extrabold tracking-[-0.02em] text-balance',
    },
    {
        name: 'Business Standard',
        className: 'font-serif text-[clamp(11.5px,1.85vw,17px)]/[1.2] font-semibold text-balance',
    },
    {
        name: 'Times of India',
        className:
            'font-serif text-[clamp(12px,1.95vw,18px)]/[1.2] font-medium tracking-[0.01em] text-balance',
    },
    {
        name: 'Economic Times',
        className: 'font-serif text-[clamp(12px,1.95vw,18px)]/[1.2] font-bold text-balance',
    },
    {
        name: 'Hindustan Times',
        className: 'text-[clamp(12px,1.9vw,17px)]/[1.2] font-bold tracking-[0.02em] text-balance',
    },
    {
        name: 'The Hindu',
        className: 'font-serif text-[clamp(13px,2.1vw,20px)]/[1.2] font-medium italic',
    },
    {
        name: 'Deccan Herald',
        className:
            'font-serif text-[clamp(12px,1.95vw,18px)]/[1.2] font-semibold tracking-[0.01em] text-balance',
    },
    {
        name: 'ET Bangalore Times',
        className: 'text-[clamp(11px,1.75vw,16px)]/[1.2] font-bold tracking-[-0.01em] text-balance',
    },
    {
        name: 'Eenadu',
        className:
            'text-[clamp(12px,1.9vw,17px)]/[1.2] font-extrabold tracking-[0.08em] text-balance uppercase',
    },
];

export type Trip = {
    tag: string;
    title: string;
    price: string;
    /** The departure itself, as a date rather than as words. */
    date: string;
    nights: string;
    src: string;
};

/**
 * The departures the calendar shows.
 *
 * `date` is an ISO day rather than a printed one. The month row filters on it
 * and the card prints it, and a single stored form is what keeps those two from
 * ever disagreeing — "9 Aug 2026" cannot be filtered without parsing prose back
 * into a date, and a second `when` field beside it is a second thing to forget
 * to change.
 *
 * Every month the row offers has at least one departure against it. A tab that
 * filters the section down to nothing is worse than a tab that is not there:
 * the visitor did the thing the page invited them to do and the page emptied.
 */
export const trips: Trip[] = [
    {
        tag: 'Comfort',
        title: 'Spellbound in Ladakh',
        price: '₹56,500',
        date: '2026-08-09',
        nights: '7 nights',
        src: img('trip-ladakh'),
    },
    {
        tag: 'Deluxe',
        title: 'Ladakh: The Great Escape',
        price: '₹87,500',
        date: '2026-08-16',
        nights: '7 nights',
        src: img('trip-pangong'),
    },
    {
        tag: 'Comfort',
        title: 'Bhutan: The Happy Kingdom',
        price: '₹72,000',
        date: '2026-09-01',
        nights: '6 nights',
        src: img('trip-bhutan'),
    },
    {
        tag: 'Signature',
        title: 'Kerala: Hills, Backwaters & Coast',
        price: '₹64,000',
        date: '2026-09-22',
        nights: '8 nights',
        src: img('kerala-backwaters'),
    },
    {
        tag: 'Comfort',
        title: 'Paro Valley Walks',
        price: '₹68,500',
        date: '2026-10-07',
        nights: '6 nights',
        src: img('paro-valley'),
    },
    {
        tag: 'Deluxe',
        title: 'Cappadocia at Sunrise',
        price: '₹1,24,000',
        date: '2026-10-19',
        nights: '9 nights',
        src: img('cappadocia'),
    },
    {
        tag: 'Signature',
        title: 'Kenya: The Great Migration',
        price: '₹1,68,000',
        date: '2026-11-05',
        nights: '8 nights',
        src: img('divider-kenya-equator'),
    },
    {
        tag: 'Comfort',
        title: 'Pangong & the High Passes',
        price: '₹59,000',
        date: '2026-11-24',
        nights: '7 nights',
        src: img('pangong-lake'),
    },
    {
        tag: 'Signature',
        title: 'Kerala for the Winter',
        price: '₹78,000',
        date: '2026-12-11',
        nights: '10 nights',
        src: img('kerala-backwaters'),
    },
    {
        tag: 'Comfort',
        title: 'Bhutan: Winter Festivals',
        price: '₹74,500',
        date: '2027-01-14',
        nights: '6 nights',
        src: img('trip-bhutan'),
    },
    {
        tag: 'Deluxe',
        title: 'Zanskar: Rivers & Ridges',
        price: '₹92,000',
        date: '2027-02-08',
        nights: '9 nights',
        src: img('divider-zanskar-rafting'),
    },
    {
        tag: 'Comfort',
        title: 'Ladakh in Early Spring',
        price: '₹61,500',
        date: '2027-03-16',
        nights: '7 nights',
        src: img('trip-ladakh'),
    },
    {
        tag: 'Signature',
        title: 'Kashmir: Vale & Valleys',
        price: '₹81,000',
        date: '2026-08-27',
        nights: '8 nights',
        src: img('hero-mountain-lake'),
    },
    {
        tag: 'Comfort',
        title: 'Coorg & the Coffee Hills',
        price: '₹44,500',
        date: '2026-09-14',
        nights: '5 nights',
        src: img('value-unhurried-pace'),
    },
    {
        tag: 'Comfort',
        title: 'Rajasthan: Forts & Palaces',
        price: '₹67,000',
        date: '2026-10-28',
        nights: '8 nights',
        src: img('value-kindred-company'),
    },
    {
        tag: 'Deluxe',
        title: 'Zanskar in Autumn',
        price: '₹89,000',
        date: '2026-11-16',
        nights: '9 nights',
        src: img('divider-zanskar-rafting'),
    },
    {
        tag: 'Comfort',
        title: 'Bhutan: Year’s End',
        price: '₹76,500',
        date: '2026-12-02',
        nights: '6 nights',
        src: img('paro-valley'),
    },
    {
        tag: 'Signature',
        title: 'Kerala: Backwaters in January',
        price: '₹71,000',
        date: '2027-01-27',
        nights: '8 nights',
        src: img('kerala-backwaters'),
    },
    {
        tag: 'Comfort',
        title: 'Pangong in the Cold',
        price: '₹62,000',
        date: '2027-02-21',
        nights: '7 nights',
        src: img('pangong-lake'),
    },
    {
        tag: 'Deluxe',
        title: 'Cappadocia in Spring',
        price: '₹1,18,000',
        date: '2027-03-04',
        nights: '9 nights',
        src: img('cappadocia'),
    },
    {
        tag: 'Deluxe',
        title: 'Kenya: Safari & the Rift',
        price: '₹1,72,000',
        date: '2026-12-19',
        nights: '9 nights',
        src: img('divider-kenya-equator'),
    },
    {
        tag: 'Comfort',
        title: 'Ladakh: Frozen Passes',
        price: '₹58,500',
        date: '2027-01-05',
        nights: '7 nights',
        src: img('trip-ladakh'),
    },
    {
        tag: 'Signature',
        title: 'Coorg in February',
        price: '₹46,000',
        date: '2027-02-03',
        nights: '5 nights',
        src: img('value-small-groups'),
    },
    {
        tag: 'Comfort',
        title: 'Paro: Spring Walks',
        price: '₹69,500',
        date: '2027-03-25',
        nights: '6 nights',
        src: img('trip-bhutan'),
    },
];

export const whyPoints = [
    'Social connection happens naturally',
    'Comfortable pace, comfortable stays',
    "You're supported, never micromanaged",
    'Everything taken care of, end to end',
];

export type Toast = { name: string; trip: string; body: string; src: string };

export const toasts: Toast[] = [
    {
        name: 'Kamala Iyer, 71',
        trip: 'Bhutan: The Happy Kingdom · 2025',
        body: '“I put this trip off for fifteen years. I only wish I hadn’t waited. I’ve never felt more looked after, or more alive.”',
        src: img('face-kamala'),
    },
    {
        name: 'Meera Nair, 63',
        trip: 'India Uncovered · 2025',
        body: '“From the first evening our tour manager made sure no one felt like the odd one out. At 63 I made friends I still call every week.”',
        src: img('face-ranjini'),
    },
    {
        name: 'Prakash Rao, 68',
        trip: 'Spellbound in Ladakh · 2024',
        body: '“They handled the altitude, the oxygen, everything. All I did was gasp at Pangong Lake. Unforgettable at any age.”',
        src: img('face-suresh'),
    },
    {
        name: 'Sulekha Patanka, 66',
        trip: 'Kerala: Hills, Backwaters & Coast · 2025',
        body: '“Eight days and not once did I feel rushed. The houseboat night alone was worth the whole trip.”',
        src: img('face-harika'),
    },
    {
        name: 'Vijay Menon, 74',
        trip: 'Royal Rajasthan · 2024',
        body: '“I travel with a walking stick and a long list of tablets. Nobody made a fuss, and nobody left me behind.”',
        src: img('face-malika'),
    },
    {
        name: 'Nirmala Reddy, 59',
        trip: 'Bhutan: The Happy Kingdom · 2024',
        body: '“I booked alone and came home with six friends. We already have next October in the diary.”',
        src: img('face-kamala'),
    },
];

export type Film = { name: string; role: string; src: string; featured?: boolean };

/** Centre card renders taller — order matters. */
export const films: Film[] = [
    { name: 'Harika', role: 'Retired architect · Bhutan ’24', src: img('face-harika') },
    {
        name: 'Malika',
        role: 'Grandmother of three · Rajasthan ’25',
        src: img('face-malika'),
        featured: true,
    },
    { name: 'Ranjini', role: 'Former teacher · Kashmir ’25', src: img('face-ranjini') },
];

/**
 * The gallery, as the design ships it.
 *
 * Falls back to this when nothing has been filed yet or the API cannot be
 * reached; `@/site/data/gallery` is where it is translated into the shape the
 * server sends. The seeder writes exactly these four rows.
 */
export type GalleryItem = { place: string; note: string; src: string };

export const gallery: GalleryItem[] = [
    {
        place: 'Pangong Lake, Ladakh',
        note: 'Ancient blue water, thin mountain air, and a group that laughed through every switchback.',
        src: img('pangong-lake'),
    },
    {
        place: 'Paro Valley, Bhutan',
        note: 'We climbed slowly to Tiger’s Nest and toasted at the top. No one left behind.',
        src: img('paro-valley'),
    },
    {
        place: 'Kerala Backwaters',
        note: 'Houseboats, coconut breeze, and the kind of quiet you feel in your chest.',
        src: img('kerala-backwaters'),
    },
    {
        place: 'Cappadocia, Türkiye',
        note: 'Up before dawn for a sky full of balloons. Worth every early morning.',
        src: img('cappadocia'),
    },
];

export type HostingStep = { title: string; body: string };

export const hostingSteps: HostingStep[] = [
    {
        title: 'The pace',
        body: "Gentle days with real rest built in: late starts, unhurried meals, and never more than you're up for.",
    },
    {
        title: 'The group',
        body: "Just 12–16 like-minded travellers, so you're among friends by the second evening, never a faceless crowd.",
    },
    {
        title: 'The hosting',
        body: 'A dedicated tour manager on every departure handles the bags, the bookings and all the little things.',
    },
    {
        title: 'The details',
        body: 'Visas, insurance, oxygen at altitude, the right chai stop, all sorted long before you pack a bag.',
    },
];

/*
 * The homepage's journal row used to have three articles of its own here,
 * separate from the journal itself. It does not any more: the row shows the
 * three newest published posts, and what it falls back to is the journal's own
 * fallback set — one journal, in one place, rather than a homepage advertising
 * three articles the index had never heard of.
 */

export const dividers = {
    adventure: {
        src: img('divider-zanskar-rafting'),
        alt: '50+ Voyagers guests with paddles before rafting the Zanskar in Ladakh',
        title: 'Adventure never asks *how old* you are.',
        body: 'Rafting the Zanskar, ballooning over Cappadocia, standing on the equator. Our voyagers keep saying yes.',
        cta: { label: 'See where we go', href: '#trips' },
    },
    sorted: {
        src: img('divider-kenya-equator'),
        alt: '50+ Voyagers group pointing at the equator sign on a Kenya safari',
        title: 'Everything sorted, *long before* you pack.',
        body: 'Visas, insurance, oxygen at altitude, the right chai stop. You just turn up and enjoy it.',
        cta: { label: 'How it works', href: '#why' },
    },
} as const;

export const whyImage = {
    src: img('why-travellers-together'),
    alt: 'Travellers together on a 50+ Voyagers departure',
};
