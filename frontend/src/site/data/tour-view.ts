import {
    itineraryFor,
    tourExclusions,
    tourInclusions,
    type ItineraryDay,
    type Tour,
} from '@/site/data/tours';
import type { TourCard, TourPage } from '@/site/data/tour-content';

/**
 * What the tour page renders, wherever it came from.
 *
 * The page used to read the shipped catalogue directly and generate the parts
 * that catalogue does not hold — the itinerary above all. That was honest for a
 * design with no database behind it, and it cannot survive contact with a real
 * tour: Spain-Portugal's thirteen days are written days with a hotel and meals
 * each, and the generator produces "Arrive in Porto".
 *
 * So this resolves one view-model from two sources, and the rule is the same
 * every time: **real content wins, generated content fills the gap**. A tour
 * that has been migrated shows what its editor wrote; a tour that has not shows
 * what it always showed. Nothing regresses on the day the database is empty,
 * and nothing stays invented once it is not.
 *
 * The generated fallbacks are kept deliberately rather than deleted. Thirty of
 * the thirty-two pages are still to migrate, and a page that renders nothing
 * until its content arrives is a page that cannot be launched incrementally.
 */

export type TourFact = { label: string; value: string };

export type TourView = {
    slug: string;
    title: string;
    /** The places line, or the shipped catalogue's own places list. */
    subtitle: string | null;
    region: string;
    summary: string;
    image: string | null;
    images: { url: string; title: string; alt: string; caption: string | null }[];
    facts: TourFact[];
    highlights: string[];
    itinerary: {
        day: number;
        title: string;
        body: string;
        stay: string | null;
        meals: string | null;
        date: string | null;
    }[];
    inclusions: string[];
    exclusions: string[];
    bookingSteps: { number: number; body: string }[];
    documents: { number: number; body: string }[];
    guidelines: { number: number; body: string }[];
    visaHtml: string | null;
    routeMapUrl: string | null;
    testimonials: { name: string; location: string | null; body: string }[];
    price: string | null;
    departs: string | null;
    duration: string | null;
    bookingFee: number | null;
    balanceDueDays: number | null;
    /** True when the itinerary is invented rather than written. */
    itineraryIsGenerated: boolean;
    meta: {
        title: string | null;
        description: string | null;
        canonical: string | null;
        ogTitle: string | null;
        ogDescription: string | null;
        ogImage: string | null;
    };
};

/**
 * A price as the site prints it.
 *
 * `₹` rather than `Rs.` — the design uses the symbol, and the homepage's
 * calendar was already writing it. Two spellings of the same price on two pages
 * a click apart is the kind of difference nobody reports and everybody notices.
 */
const rupees = (amount: number) =>
    `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;

/**
 * A departure date as a *card* prints it: `2 Nov 2026`.
 *
 * The long form below is right where a date has a line to itself — the tour
 * page's facts strip, an itinerary day. On a card it shares one line with the
 * duration, and "2 November 2026 · 12 nights" wraps at the width three cards
 * across actually leaves.
 */
function cardDate(iso: string | null): string | null {
    const full = readableDate(iso);

    if (!full) return null;

    const [day, month, year] = full.split(' ');

    return `${day} ${month.slice(0, 3)} ${year}`;
}

/**
 * The words out of a content field.
 *
 * `content` and `visa_content` hold prose. They were once named `*_html` and
 * the suffix was always a misreading: the importer writes `textContent` with
 * the tags already stripped, and the admin now cleans pasted markup to text on
 * the way in.
 *
 * This stays because the guarantee is only as old as the sanitiser. Rows
 * imported or seeded before it still carry `<p>` tags, and a tag that reaches
 * the page prints literally on screen — readers saw "&lt;p&gt;Twelve nights in
 * centrally located...".
 *
 * Stripped rather than rendered as HTML on purpose. This is text an editor
 * types into a panel, so injecting it with `dangerouslySetInnerHTML` would put
 * an XSS hole on every tour page for the sake of markup the design does not use
 * — these fields are read as single blocks of prose, not as formatted
 * documents. Paragraph and line breaks become newlines, which the components
 * already render through `whitespace-pre-line`.
 */
function plainText(html: string | null | undefined): string {
    if (!html) return '';

    return (
        html
            /* A closing paragraph or a break is where a line ends. */
            .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            /* The few entities an editor's markup actually produces. */
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            /* Collapse the blank lines the tag replacements leave behind. */
            .replace(/\n{3,}/g, '\n\n')
            .trim()
    );
}

/** "23 September 2026", built from the parts so no timezone can shift it. */
function readableDate(iso: string | null): string | null {
    if (!iso) return null;

    const [year, month, day] = iso.slice(0, 10).split('-').map(Number);

    if (!year || !month || !day) return null;

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    return `${day} ${months[month - 1]} ${year}`;
}

/**
 * The page, built from the database with the shipped record filling any gap.
 *
 * `shipped` is optional: a tour that exists only in the database has no
 * catalogue entry, and that is the normal case once migration is done.
 */
export function fromDatabase(page: TourPage, shipped?: Tour): TourView {
    const next = page.departures[0] ?? null;

    const duration =
        next?.nights != null
            ? `${next.nights + 1} days / ${next.nights} nights`
            : (shipped?.duration ?? null);

    const departs = readableDate(next?.starts_on ?? null) ?? shipped?.departs ?? null;
    const price = next ? rupees(next.price) : (shipped?.price ?? null);

    const cover = page.images.find((image) => image.is_cover) ?? page.images[0] ?? null;

    const facts: TourFact[] = [];
    if (departs) facts.push({ label: 'Departs', value: departs });
    if (duration) facts.push({ label: 'Duration', value: duration });
    /*
     * The price sits with the other facts as well as in the booking panel. It
     * is the first thing a reader wants and the panel is below the fold on a
     * phone, so leaving it out of this strip meant scrolling past a full-width
     * photograph to find the one number the decision turns on.
     */
    if (price) facts.push({ label: 'From', value: price });
    facts.push({ label: 'Group size', value: '12–16 guests' });
    if (page.region) facts.push({ label: 'Region', value: page.region });

    /*
     * The itinerary is the one section where the fallback really matters, so
     * the flag is carried on the view rather than inferred by the component —
     * a page that is showing generated days should be able to say so.
     */
    const written = page.itinerary.length > 0;

    const itinerary = written
        ? page.itinerary.map((day) => ({
              day: day.day_number,
              title: day.title ?? day.heading,
              body: plainText(day.body),
              stay: day.stay,
              meals: day.meals,
              date: readableDate(day.date),
          }))
        : generated(shipped);

    return {
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle ?? shipped?.places.join(' · ') ?? null,
        region: page.region ?? shipped?.region ?? 'India',
        summary: page.summary ?? shipped?.summary ?? '',
        /*
         * The tour's own picture leads, then the carousel's cover, then the
         * shipped catalogue's. An editor who chose a lead image is overruling
         * the guess the cover flag makes; a tour nobody has chosen one for
         * keeps exactly the picture it showed before the field existed.
         */
        image: page.image_url ?? cover?.url ?? shipped?.image ?? null,
        images: page.images
            .filter((image): image is typeof image & { url: string } => Boolean(image.url))
            .map((image) => ({
                url: image.url,
                title: image.title,
                alt: image.alt,
                caption: image.caption,
            })),
        facts,
        highlights: page.highlights.length > 0 ? page.highlights : (shipped?.highlights ?? []),
        itinerary,
        itineraryIsGenerated: !written,
        /*
         * Every one of these is a rich-text column in the admin, so each
         * arrives as HTML and has to be reduced to its words before a
         * component prints it.
         */
        inclusions: page.inclusions.length > 0 ? page.inclusions.map(plainText) : tourInclusions,
        exclusions: page.exclusions.length > 0 ? page.exclusions.map(plainText) : tourExclusions,
        bookingSteps: page.booking_steps.map((step) => ({
            number: step.number,
            body: plainText(step.body),
        })),
        documents: page.documents.map((item) => ({
            number: item.number,
            body: plainText(item.body),
        })),
        guidelines: page.guidelines.map((item) => ({
            number: item.number,
            body: plainText(item.body),
        })),
        visaHtml: page.visa_content ? plainText(page.visa_content) : null,
        routeMapUrl: page.route_map_url,
        testimonials: page.testimonials
            .filter((quote): quote is typeof quote & { body: string } => Boolean(quote.body))
            .map((quote) => ({ name: quote.name, location: quote.location, body: quote.body })),
        price,
        departs,
        duration,
        bookingFee: page.booking_fee,
        balanceDueDays: page.balance_due_days,
        meta: {
            title: page.meta_title,
            description: page.meta_description,
            canonical: page.canonical_url,
            ogTitle: page.og_title,
            ogDescription: page.og_description,
            ogImage: page.og_image_url,
        },
    };
}

/**
 * The page as it was before the database existed.
 *
 * Used for the thirty tours still to migrate, so the site keeps working exactly
 * as it does today while they are moved across one at a time.
 */
export function fromCatalogue(tour: Tour): TourView {
    return {
        slug: tour.slug,
        title: tour.title,
        subtitle: tour.places.join(' · '),
        region: tour.region,
        summary: tour.summary,
        image: tour.image,
        images: [],
        facts: [
            { label: 'Departs', value: tour.departs },
            { label: 'Duration', value: tour.duration },
            { label: 'Group size', value: '12–16 guests' },
            { label: 'Region', value: tour.region },
        ],
        highlights: tour.highlights,
        itinerary: generated(tour),
        itineraryIsGenerated: true,
        inclusions: tourInclusions,
        exclusions: tourExclusions,
        bookingSteps: [],
        documents: [],
        guidelines: [],
        visaHtml: null,
        routeMapUrl: null,
        testimonials: [],
        price: tour.price,
        departs: tour.departs,
        duration: tour.duration,
        bookingFee: null,
        balanceDueDays: null,
        meta: {
            title: null,
            description: null,
            canonical: null,
            ogTitle: null,
            ogDescription: null,
            ogImage: null,
        },
    };
}

/**
 * An API card in the shape the listing's card component already renders.
 *
 * The listing draws `Tour`, the shipped catalogue's record. Rather than teach
 * the card a second type — and give the two a chance to drift apart in what a
 * price or a date looks like — the API's card is mapped into that record here,
 * beside the page mapper, using the same `rupees` and `readableDate` the detail
 * view uses. A card and the page it opens then quote a figure the one way.
 *
 * The fields a listing card never reads are filled with empties rather than
 * invented: `summary` and `highlights` belong to the detail page, and this is
 * not the place to make them up.
 */
export function fromCard(card: TourCard): Tour {
    /*
     * Nights alone, not "13 days / 12 nights".
     *
     * That longer phrasing belongs to the tour page's own facts strip, where it
     * has a line to itself. On a card it shares one line with the departure
     * date — "2 Nov 2026 · 12 nights" — and the fuller form wrapped that line
     * at the width three cards across actually gives it.
     */
    const duration = card.nights != null ? `${card.nights} nights` : '';

    return {
        slug: card.slug,
        title: card.title,
        /* The API's own word, passed through. "Domestic" is the client's label
           for an Indian departure and is not this layer's to rewrite. */
        region: card.region ?? '',
        /* Empty rather than today's month: a tour with no CRM departure has no
           month, and inventing one files it under a tab it does not belong in. */
        month: card.month ?? '',
        departs: cardDate(card.starts_on) ?? '',
        duration,
        /* A card without a price says nothing, as the resource intends. */
        price: card.price != null ? rupees(card.price) : '',
        /* The places line the CRM holds as one string, split back into the list
           the card prints with separators of its own. */
        places: card.subtitle ? card.subtitle.split(/\s*,\s*/).filter(Boolean) : [],
        summary: '',
        highlights: [],
        image: card.image_url ?? '',
    };
}

/** The design's own day generator, in the view's shape. */
function generated(tour: Tour | undefined): TourView['itinerary'] {
    if (!tour) return [];

    return itineraryFor(tour).map((day: ItineraryDay) => ({
        day: day.day,
        title: day.title,
        body: day.body,
        stay: null,
        meals: null,
        date: null,
    }));
}
