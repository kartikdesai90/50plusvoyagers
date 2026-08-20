/**
 * Silver Space — the day-outs, fitness sessions and creative workshops the club
 * runs in Bengaluru between departures.
 *
 * Grouped by strand rather than listed flat, because that is how the programme
 * is actually organised and how a visitor chooses: they know whether they came
 * for the body, the hands or the company before they know which class.
 */

const img = (name: string) => `/images/home/${name}.webp`;

export type Workshop = {
    title: string;
    format: string;
    price: string;
    body: string;
};

export type WorkshopStrand = {
    slug: string;
    name: string;
    tagline: string;
    body: string;
    image: string;
    workshops: Workshop[];
};

export const workshopStrands: WorkshopStrand[] = [
    {
        slug: 'active-fitness',
        name: 'Active Fitness',
        tagline: 'Move well, at your own tempo',
        body: 'Low-impact classes led by instructors who train older adults for a living. Chairs are always available, and nobody is ever the odd one out for taking the gentler option.',
        image: img('value-unhurried-pace'),
        workshops: [
            {
                title: 'Dance Zumba for Seniors',
                format: '3 sessions a week · 45 minutes',
                price: 'From ₹600',
                body: 'Low-impact choreography to music you actually know, with every step offered in a seated version.',
            },
            {
                title: 'Sivananda Hatha Yoga',
                format: '12 classes over 4 weeks',
                price: 'From ₹1,250',
                body: 'Classical hatha with props and wall support, taught for stiff mornings rather than for photographs.',
            },
            {
                title: 'Tai Chi Wellness Series',
                format: '12 classes over 6 weeks',
                price: '₹3,000',
                body: 'A slow, standing practice for balance and confidence on uneven ground — useful on every trip we run.',
            },
        ],
    },
    {
        slug: 'active-creativity',
        name: 'Active Creativity',
        tagline: 'Learn a craft you never had time for',
        body: 'Short painting and folk-art courses in small batches. All materials are provided, and you leave the first class with something finished in your hands.',
        image: img('value-kindred-company'),
        workshops: [
            {
                title: 'Amsterdam in Acrylics',
                format: '2 classes',
                price: '₹1,100',
                body: 'Canal houses and bicycles, built up in simple layers. No drawing experience assumed.',
            },
            {
                title: 'Kerala Mural: Dancing Ganesha',
                format: '3 classes',
                price: '₹1,500',
                body: 'The traditional five-colour mural technique, taught from the outline up by a practising muralist.',
            },
            {
                title: 'One Stroke Painting',
                format: '2 classes',
                price: '₹1,000',
                body: 'The double-loaded brush method that turns one stroke into a whole petal.',
            },
            {
                title: 'Indian Folk Art Series',
                format: 'Rotating weekend batches',
                price: 'From ₹1,000',
                body: 'Warli, Madhubani, Gond, Kalamkari and Pichwai, each taught as its own short course.',
            },
        ],
    },
    {
        slug: 'active-mind',
        name: 'Active Mind',
        tagline: 'Good company, and something to talk about',
        body: 'Hobby circles, skills sessions and day-outs around Bengaluru. Half the point is the class; the other half is who you meet in it.',
        image: img('value-small-groups'),
        workshops: [
            {
                title: 'Organic Terrace Gardening',
                format: 'Monthly, half day',
                price: 'From ₹800',
                body: 'Composting, container soil and what actually survives a Bengaluru balcony.',
            },
            {
                title: 'Smartphone & Social Media',
                format: '4 sessions',
                price: '₹1,200',
                body: 'Video calls, UPI, photo backups and how to spot a scam message. Patient, and repeated as often as you like.',
            },
            {
                title: 'Photography Walks',
                format: 'Monthly, morning',
                price: '₹900',
                body: 'A guided walk with a photographer, phone or camera, ending in coffee and a group critique.',
            },
            {
                title: 'Sudoku & Puzzle Circle',
                format: 'Fortnightly',
                price: 'Free for members',
                body: 'An hour of puzzles and an hour of chai. The most oversubscribed thing we run.',
            },
        ],
    },
];

export const dayOuts = [
    {
        title: 'Wine country day-out',
        body: 'A vineyard morning outside Bengaluru with a tasting, a long lunch and back home before dark.',
        image: img('why-travellers-together'),
    },
    {
        title: 'Heritage walks',
        body: 'Pete markets, Basavanagudi and the Cantonment, walked slowly with a historian and plenty of seats.',
        image: img('value-fully-hosted'),
    },
    {
        title: 'Nature & birding mornings',
        body: 'Early starts at the lakes and the Ramanagara hills, with binoculars provided and a level path throughout.',
        image: img('divider-zanskar-rafting'),
    },
];
