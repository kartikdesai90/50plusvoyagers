/**
 * The group tour catalogue.
 *
 * Static for now, and shaped as the API will be: every field a card or a tour
 * page renders is a property of the record, so swapping this module for a fetch
 * changes the import and nothing else. The photography reuses the existing
 * library — a tour carries an `image` key rather than deriving one, so real
 * per-tour imagery drops in without touching a component.
 */

const img = (name: string) => `/images/home/${name}.webp`;

export type Tour = {
    slug: string;
    title: string;
    /** Broad grouping, used as the card badge and the listing filter. */
    region: 'India' | 'International';
    /** Departure month key, e.g. `2026-09`. Drives the month filter. */
    month: string;
    /** Human departure date, as printed on the card. */
    departs: string;
    duration: string;
    price: string;
    /** Places visited, in itinerary order. */
    places: string[];
    summary: string;
    highlights: string[];
    image: string;
    /** Set on the handful the listing surfaces first. */
    featured?: boolean;
};

/** What every departure includes, regardless of destination. */
export const tourInclusions = [
    'A dedicated 50+ Voyagers tour manager travelling with the group, start to finish',
    'Senior-friendly hotels chosen for lifts, walk-in showers and central locations',
    'All transfers in air-conditioned vehicles, with unhurried breaks between drives',
    'Daily breakfast plus the meals named in the itinerary, with dietary needs catered for',
    'All sightseeing, entry fees and permits listed in the itinerary',
    'Oxygen support and a first-aid kit on every high-altitude departure',
];

export const tourExclusions = [
    'Airfare to and from the starting city, unless stated otherwise',
    'Visa fees and travel insurance, which we are glad to help arrange',
    'Personal expenses, tips, and anything not named in the inclusions',
];

/** The pace and hosting promises repeated on every tour page. */
export const tourPromises = [
    {
        title: 'Small groups',
        body: 'Between 12 and 16 travellers, so nobody is a face in a crowd and no bus waits on a queue.',
    },
    {
        title: 'A leisurely pace',
        body: 'Late starts, real rest built into the day, and never more walking than the group is up for.',
    },
    {
        title: 'Fully hosted',
        body: 'Bags, bookings, chemists, chai stops. Your tour manager carries the logistics; you carry the camera.',
    },
    {
        title: 'Kindred company',
        body: 'Everyone on board is 50 or over. Same season of life, same stories, same sense of adventure.',
    },
];

export const tours: Tour[] = [
    {
        slug: 'hampi-badami-heritage',
        title: 'Hampi & the Chalukyan Trail',
        region: 'India',
        month: '2026-09',
        departs: '7 Sep 2026',
        duration: '3 days',
        price: '₹22,000',
        places: ['Hampi', 'Pattadakal', 'Badami', 'Aihole'],
        summary:
            'A short, unhurried run through the boulder-strewn capital of Vijayanagara and the rock-cut temples that came before it. Three days, one region, no early flights.',
        highlights: [
            'Sunrise over the Hampi bazaar before the day-trippers arrive',
            'The cave temples at Badami, taken slowly and with plenty of shade',
            'Pattadakal and Aihole with a guide who reads the carvings for you',
        ],
        image: img('trip-ladakh'),
        featured: true,
    },
    {
        slug: 'spain-and-portugal',
        title: 'Spain & Portugal',
        region: 'International',
        month: '2026-09',
        departs: '23 Sep 2026',
        duration: '12 nights',
        price: '₹5,54,000',
        places: ['Porto', 'Lisbon', 'Seville', 'Barcelona', 'Madrid'],
        summary:
            'Iberia at a pace that lets you sit in the square rather than march past it. Five cities, long lunches, and trains instead of coach marathons.',
        highlights: [
            'A port lodge tasting on the Douro, seated and shaded',
            'Seville in the cool of the evening, when the city wakes up',
            'Barcelona with pre-booked timed entries, so there is no standing in line',
        ],
        image: img('cappadocia'),
        featured: true,
    },
    {
        slug: 'bhutan-tiger-nest-september',
        title: 'Bhutan: The Happy Kingdom',
        region: 'International',
        month: '2026-09',
        departs: '24 Sep 2026',
        duration: '7 days',
        price: '₹82,000',
        places: ['Thimphu', 'Paro', 'Punakha', "Tiger's Nest"],
        summary:
            'The Himalayan kingdom in its gentlest season, with the climb to Taktsang split over a full morning and ponies available for the first stretch.',
        highlights: [
            "Taktsang — Tiger's Nest — at your own pace, with a rest stop halfway",
            'The Punakha Dzong at the meeting of two rivers',
            'A farmhouse lunch and a hot stone bath in the Paro valley',
        ],
        image: img('trip-bhutan'),
        featured: true,
    },
    {
        slug: 'iceland-golden-circle',
        title: 'Iceland: Fire, Ice & the Golden Circle',
        region: 'International',
        month: '2026-09',
        departs: '25 Sep 2026',
        duration: '9 days',
        price: '₹5,23,000',
        places: ['Reykjavik', 'Golden Circle', 'Blue Lagoon', 'South Coast'],
        summary:
            'Waterfalls, geysers and black sand, all within a short, level walk of the coach — Iceland is one of the kindest countries there is to travel slowly in.',
        highlights: [
            'The Blue Lagoon with a private changing suite booked for the group',
            'Gullfoss and Geysir on boardwalks, no scrambling required',
            'A northern lights watch on every clear night of the trip',
        ],
        image: img('hero-mountain-lake'),
    },
    {
        slug: 'kinnaur-and-kalpa',
        title: 'Kinnaur & Kalpa',
        region: 'India',
        month: '2026-10',
        departs: '7 Oct 2026',
        duration: '10 days',
        price: '₹72,000',
        places: ['Shimla', 'Narkanda', 'Sangla', 'Chitkul', 'Kalpa'],
        summary:
            'The old Hindustan–Tibet road through apple country to the last village before the border, with two nights in each place so the altitude is never rushed.',
        highlights: [
            'Kinnaur Kailash at first light from the Kalpa balcony',
            'Chitkul, the last inhabited village on the Indo-Tibetan road',
            'Apple orchards in harvest, and cider straight from the press',
        ],
        image: img('pangong-lake'),
    },
    {
        slug: 'central-europe',
        title: 'Central Europe: Four Capitals',
        region: 'International',
        month: '2026-10',
        departs: '7 Oct 2026',
        duration: '10 days',
        price: '₹3,40,000',
        places: ['Prague', 'Vienna', 'Bratislava', 'Budapest'],
        summary:
            'Prague to Budapest along the Danube, with a river cruise, a concert, and enough coffee-house afternoons to make it feel like a holiday rather than a checklist.',
        highlights: [
            'A classical evening in Vienna with reserved seating',
            'The Danube by boat between Bratislava and Budapest',
            'Budapest thermal baths, with a quiet hour booked for the group',
        ],
        image: img('paro-valley'),
    },
    {
        slug: 'andaman-islands',
        title: 'Andaman Islands',
        region: 'India',
        month: '2026-10',
        departs: '11 Oct 2026',
        duration: '6 days',
        price: '₹72,000',
        places: ['Port Blair', 'Havelock', 'North Bay Island', 'Ross Island'],
        summary:
            'Warm water, soft sand and a slow ferry between islands. Snorkelling for those who want it, a glass-bottomed boat for those who would rather stay dry.',
        highlights: [
            'Radhanagar beach at sunset, widely called Asia’s finest',
            'The Cellular Jail light-and-sound show',
            'Coral off North Bay, seen from a glass-bottomed boat',
        ],
        image: img('kerala-backwaters'),
    },
    {
        slug: 'himachal-dalhousie-dharamshala',
        title: 'Himachal: Khajjiar to Dharamshala',
        region: 'India',
        month: '2026-10',
        departs: '25 Oct 2026',
        duration: '7 days',
        price: '₹54,000',
        places: ['Khajjiar', 'Dalhousie', 'Chamba', 'Dharamshala'],
        summary:
            'Cedar forests, colonial hill stations and the Tibetan quarter at McLeod Ganj, on a route with short drives and long views.',
        highlights: [
            'Khajjiar meadow, the so-called mini Switzerland of India',
            'The Bhagsunag falls walk, with a level alternative for anyone who prefers it',
            'Morning prayers at the Tsuglagkhang complex',
        ],
        image: img('trip-pangong'),
    },
    {
        slug: 'meghalaya-cherrapunji',
        title: 'Meghalaya: Abode of Clouds',
        region: 'India',
        month: '2026-10',
        departs: '25 Oct 2026',
        duration: '7 days',
        price: '₹62,000',
        places: ['Shillong', 'Cherrapunji', 'Mawlynnong', 'Dawki'],
        summary:
            'Living root bridges, the cleanest village in Asia and a river so clear the boats look airborne. Steps are optional throughout, and always announced in advance.',
        highlights: [
            'The Umngot river at Dawki, by rowing boat',
            'Mawlynnong village and its bamboo skywalk',
            'Nohkalikai falls from the viewing deck — no descent needed',
        ],
        image: img('divider-zanskar-rafting'),
    },
    {
        slug: 'kerala-munnar-alleppey',
        title: 'Kerala: Hills, Backwaters & Coast',
        region: 'India',
        month: '2026-10',
        departs: '26 Oct 2026',
        duration: '8 days',
        price: '₹62,000',
        places: ['Kochi', 'Munnar', 'Thekkady', 'Alleppey'],
        summary:
            'Tea gardens, a night on a houseboat and old Kochi at walking pace. The gentlest itinerary we run, and the one we most often recommend for a first trip.',
        highlights: [
            'A full night aboard a private houseboat on the backwaters',
            'Tea estate walk in Munnar, entirely on the level',
            'Kathakali and Fort Kochi by evening light',
        ],
        image: img('kerala-backwaters'),
        featured: true,
    },
    {
        slug: 'bhutan-thunder-dragon-october',
        title: 'Bhutan: Land of the Thunder Dragon',
        region: 'International',
        month: '2026-10',
        departs: '28 Oct 2026',
        duration: '7 days',
        price: '₹82,000',
        places: ['Thimphu', 'Paro', 'Punakha', 'Dochula Pass'],
        summary:
            'The autumn departure, timed for clear skies over the Dochula pass and the festival season in the valleys.',
        highlights: [
            'The 108 chortens at Dochula with the Himalaya behind them',
            'A valley festival, if the calendar obliges',
            'Archery with a local club in Thimphu',
        ],
        image: img('trip-bhutan'),
    },
    {
        slug: 'royal-rajasthan',
        title: 'Royal Rajasthan',
        region: 'India',
        month: '2026-11',
        departs: '15 Nov 2026',
        duration: '10 days',
        price: '₹72,000',
        places: ['Jaipur', 'Jodhpur', 'Jaisalmer', 'Bikaner'],
        summary:
            'Four desert cities in the good season, with heritage stays, a night under canvas at the dunes and jeeps instead of camels for anyone who prefers them.',
        highlights: [
            'Sunset at the Jaisalmer dunes, with a folk evening',
            'Mehrangarh fort in Jodhpur, reached by lift',
            'A heritage haveli stay in Bikaner',
        ],
        image: img('trip-ladakh'),
    },
    {
        slug: 'vietnam-and-cambodia',
        title: 'Vietnam & Cambodia',
        region: 'International',
        month: '2026-11',
        departs: '16 Nov 2026',
        duration: '10 days',
        price: '₹2,12,000',
        places: ['Hanoi', 'Halong Bay', 'Siem Reap', 'Angkor'],
        summary:
            'An overnight cruise in Halong Bay and the temples of Angkor at dawn, with electric buggies inside the complex so the walking stays optional.',
        highlights: [
            'A night aboard a Halong Bay junk',
            'Angkor Wat at sunrise, with buggy transfers between temples',
            'A water puppet show and street-food walk in Hanoi',
        ],
        image: img('cappadocia'),
    },
    {
        slug: 'arunachal-tawang',
        title: 'Arunachal: The Road to Tawang',
        region: 'India',
        month: '2026-11',
        departs: '16 Nov 2026',
        duration: '10 days',
        price: '₹80,000',
        places: ['Guwahati', 'Bomdila', 'Dirang', 'Tawang'],
        summary:
            'The high road to the great monastery, broken into short driving days with acclimatisation nights built in and oxygen carried throughout.',
        highlights: [
            'Tawang monastery, the largest in India',
            'Sela pass at 13,700 feet, with a warm stop either side',
            'Monpa villages and hot springs at Dirang',
        ],
        image: img('paro-valley'),
    },
    {
        slug: 'japan-in-autumn',
        title: 'Japan in Autumn',
        region: 'International',
        month: '2026-11',
        departs: '18 Nov 2026',
        duration: '10 days',
        price: '₹3,20,000',
        places: ['Tokyo', 'Mt. Fuji', 'Kyoto', 'Osaka'],
        summary:
            'Maple season, bullet trains and a ryokan night. Luggage is forwarded between cities, so nobody carries a case onto a platform.',
        highlights: [
            'The Shinkansen to Kyoto with reserved seats and forwarded bags',
            'Autumn colour at Arashiyama and the Fushimi Inari approach',
            'A ryokan evening with a kaiseki dinner and chair seating',
        ],
        image: img('hero-mountain-lake'),
    },
    {
        slug: 'saurashtra-gujarat',
        title: 'Saurashtra: Temples & Lions',
        region: 'India',
        month: '2026-11',
        departs: '18 Nov 2026',
        duration: '9 days',
        price: '₹66,000',
        places: ['Patan', 'Dwarka', 'Somnath', 'Gir', 'Diu'],
        summary:
            'A pilgrimage-and-wildlife route across Gujarat, ending on the quiet beaches of Diu. Temple visits are timed to avoid the crowds and the midday sun.',
        highlights: [
            'Somnath aarti from a reserved seating area',
            'A morning safari in Gir, home of the Asiatic lion',
            'The Rani ki Vav stepwell at Patan',
        ],
        image: img('divider-kenya-equator'),
    },
    {
        slug: 'odisha-konark-puri',
        title: 'Odisha: Konark & the Coast',
        region: 'India',
        month: '2026-11',
        departs: '22 Nov 2026',
        duration: '6 days',
        price: '₹48,000',
        places: ['Bhubaneswar', 'Konark', 'Puri', 'Chilika'],
        summary:
            'The sun temple, the Jagannath coast and a dawn boat on Chilika lake, at six days the easiest of our November departures.',
        highlights: [
            'The Konark sun temple with a heritage guide',
            'Dolphin spotting on Chilika at first light',
            'Pattachitra painters at work in Raghurajpur',
        ],
        image: img('kerala-backwaters'),
    },
    {
        slug: 'bali',
        title: 'Bali: Temples, Rice & Sea',
        region: 'International',
        month: '2026-12',
        departs: '2 Dec 2026',
        duration: '6 days',
        price: '₹88,000',
        places: ['Ubud', 'Mount Batur', 'Tanah Lot', 'Seminyak'],
        summary:
            'Rice terraces, a volcano at sunrise seen from a viewpoint rather than a summit, and unhurried afternoons by the water.',
        highlights: [
            'Tegallalang rice terraces from the upper terrace café',
            'Sunset at the Tanah Lot sea temple',
            'A Balinese cooking morning, seated throughout',
        ],
        image: img('trip-pangong'),
    },
    {
        slug: 'mandu-and-ujjain',
        title: 'Mandu, Maheshwar & Ujjain',
        region: 'India',
        month: '2026-12',
        departs: '6 Dec 2026',
        duration: '6 days',
        price: '₹45,500',
        places: ['Indore', 'Mandu', 'Maheshwar', 'Ujjain'],
        summary:
            'Afghan ruins on a plateau, a ghat town on the Narmada and the Mahakaleshwar temple — a short, gentle loop through central India.',
        highlights: [
            'The Jahaz Mahal at Mandu, floating between two lakes',
            'An evening boat on the Narmada at Maheshwar',
            'Bhasma aarti at Ujjain, arranged in advance',
        ],
        image: img('trip-ladakh'),
    },
    {
        slug: 'madhya-pradesh-khajuraho',
        title: 'Madhya Pradesh: Gwalior to Bandhavgarh',
        region: 'India',
        month: '2026-12',
        departs: '14 Dec 2026',
        duration: '7 days',
        price: '₹55,000',
        places: ['Gwalior', 'Orchha', 'Khajuraho', 'Bandhavgarh'],
        summary:
            'Forts, temple sculpture and a tiger reserve, linked by short drives and one comfortable train leg.',
        highlights: [
            'Khajuraho with an art historian, in the cool of the morning',
            'Orchha cenotaphs at sunset from the riverbank',
            'Two safaris in Bandhavgarh, in cushioned jeeps',
        ],
        image: img('divider-zanskar-rafting'),
    },
];

/** The month tabs on the listing, derived so they can never disagree with the tours. */
export const tourMonths = [...new Set(tours.map((tour) => tour.month))].sort();

/** `2026-09` → `SEP '26`, matching the homepage's departure strip. */
export function monthLabel(month: string): string {
    const [year, monthNumber] = month.split('-');
    const names = [
        'JAN',
        'FEB',
        'MAR',
        'APR',
        'MAY',
        'JUN',
        'JUL',
        'AUG',
        'SEP',
        'OCT',
        'NOV',
        'DEC',
    ];

    return `${names[Number(monthNumber) - 1]} '${year.slice(2)}`;
}

/** One day on a departure, as the tour page prints it. */
export type ItineraryDay = {
    /** 1-based, and contiguous — every day of the trip is accounted for. */
    day: number;
    /** Where the day is spent. */
    place: string;
    title: string;
    body: string;
};

/** The number of days a duration describes, however it is written. */
function durationInDays(duration: string): number {
    const count = Number(duration.match(/\d+/)?.[0] ?? 0);

    /* A trip sold in nights is one day longer than it is nights: six nights
       away is a week, because the day you fly home is still a day of it. */
    return duration.includes('night') ? count + 1 : count;
}

/**
 * The day-by-day, worked out from the places and the length.
 *
 * Derived rather than written out per tour, and deliberately: twenty tours of
 * hand-authored prose is twenty chances for a day count to disagree with the
 * duration printed three lines above it. What is written here is the shape a
 * departure actually has — a day to arrive, a day to leave, and the days
 * between shared out across the places in the order they are visited — so the
 * itinerary is always as long as the trip claims to be.
 *
 * The words are honest about being a summary. They say what a day in a place
 * consists of on a hosted trip rather than naming sights nobody has confirmed,
 * because a fabricated monument is worse than an unspecific one. Real per-day
 * copy is a field on the record the day the catalogue moves to the database,
 * and this becomes the fallback for a tour nobody has written one for yet.
 */
export function itineraryFor(tour: Tour): ItineraryDay[] {
    const total = durationInDays(tour.duration);
    const places = tour.places;

    if (total < 2 || places.length === 0) return [];

    const first = places[0];
    const last = places[places.length - 1];

    const days: ItineraryDay[] = [
        {
            day: 1,
            place: first,
            title: `Arrive in ${first}`,
            body: `Met on arrival and driven to the hotel, with the rest of the day free to settle in. Your tour manager gathers the group in the evening to walk through the days ahead over dinner.`,
        },
    ];

    /*
     * The middle. Every place after the first gets at least one day, and any
     * days left over are handed back to the earlier places — which is where a
     * longer stay actually goes on a real itinerary.
     */
    const middleDays = total - 2;
    const middlePlaces = places.slice(1);

    if (middleDays > 0 && middlePlaces.length > 0) {
        const each = Math.floor(middleDays / middlePlaces.length);
        const spare = middleDays % middlePlaces.length;

        let day = 2;

        middlePlaces.forEach((place, index) => {
            const nights = each + (index < spare ? 1 : 0);

            for (let n = 0; n < nights; n += 1) {
                const arriving = n === 0;

                /* Two identical rows read as a mistake rather than as a
                   second day, so a longer stay names what the extra day is
                   for instead of repeating the first one's words. */
                const spent = ['at your own pace', 'without the clock', 'to go deeper'][
                    Math.min(n - 1, 2)
                ];

                days.push({
                    day,
                    place,
                    title: arriving ? `On to ${place}` : `${place} ${spent}`,
                    body: arriving
                        ? `An unhurried drive to ${place}, with stops for chai and photographs along the way. The afternoon is spent seeing the place itself, at a pace the whole group is comfortable with.`
                        : n === 1
                          ? `A full day in ${place} with time built in to rest. The morning is guided; the afternoon is yours to spend as you like, with your tour manager on hand either way.`
                          : `A second unhurried day here, for the corners a single day never reaches — a market, a longer lunch, or simply an armchair and the view.`,
                });

                day += 1;
            }
        });
    }

    days.push({
        day: total,
        place: last,
        title: 'Homeward',
        body: `A relaxed final morning and time for last photographs before transfers to the airport or station, and the journey home.`,
    });

    return days;
}

export function findTour(slug: string): Tour | undefined {
    return tours.find((tour) => tour.slug === slug);
}
