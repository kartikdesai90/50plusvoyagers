import 'server-only';

import { laravelOrigin } from '@/site/data/origin';

/**
 * One tour page, fetched from Laravel while the page renders.
 *
 * `server-only` is load-bearing, as it is on the journal's content: this module
 * holds the address Laravel answers on, which is internal, and importing it
 * from a client component would put that address in the browser bundle.
 *
 * Fetched during the server render, never after boot. A tour whose itinerary
 * arrived after hydration is an itinerary no crawler ever reads — which for
 * pages that already rank is most of the point.
 */

/** A departure as the CRM holds it. One page can have several. */
export type TourDeparture = {
    tour_code: string;
    starts_on: string | null;
    ends_on: string | null;
    nights: number | null;
    price: number;
    advance?: number;
    early_bird: number;
    single_supplement: number;
    booking_open: boolean;
    status?: string;
    category: string;
    short_name?: string;
    website_name?: string;
    website_link?: string;
};

export type TourItineraryDay = {
    day_number: number;
    heading: string;
    title: string | null;
    body: string;
    stay: string | null;
    meals: string | null;
    /** Derived from the CRM departure, or null when there is none to count from. */
    date: string | null;
};

export type TourPage = {
    slug: string;
    title: string;
    subtitle: string | null;
    region: string | null;
    summary: string | null;
    ribbon_text: string | null;
    /** The tour's own main picture. Null until an editor chooses one. */
    image_url: string | null;
    route_map_url: string | null;
    visa_content: string | null;
    booking_fee: number | null;
    balance_due_days: number | null;
    departures: TourDeparture[];
    images: {
        url: string | null;
        /** The place, printed over the picture in serif. */
        title: string;
        alt: string;
        caption: string | null;
        is_cover: boolean;
    }[];
    highlights: string[];
    itinerary: TourItineraryDay[];
    inclusions: string[];
    exclusions: string[];
    booking_steps: { number: number; body: string }[];
    documents: { number: number; body: string }[];
    guidelines: { number: number; body: string }[];
    testimonials: {
        name: string;
        location: string | null;
        body: string | null;
        rating: number | null;
    }[];
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    canonical_url: string | null;
};

const origin = laravelOrigin;

/**
 * An editor publishing a tour expects to see it. The same sixty seconds the
 * journal and the homepage use, for the same reason.
 */
const REVALIDATE = 60;

export async function fetchTourPage(slug: string): Promise<TourPage | null> {
    try {
        const response = await fetch(`${origin}/api/site/tours/${encodeURIComponent(slug)}`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: REVALIDATE },
        });

        /*
         * A 404 is an answer, not a failure: nothing is published at that
         * address. The caller turns it into its own fallback, which is what it
         * is for.
         */
        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Laravel answered ${response.status}`);
        }

        const body = (await response.json()) as { data: TourPage };

        return body.data;
    } catch (error) {
        /*
         * Loudly logged. A tour page quietly serving the catalogue the design
         * ships with, when a real one exists, is the kind of fault that is
         * noticed weeks later by somebody wondering why an edit never appeared.
         */
        console.error(`[tours] could not reach Laravel for "${slug}"`, error);

        return null;
    }
}

/**
 * One tour as a card — what the homepage calendar and the listing show.
 *
 * `slug` is the field that matters most: it is where the card leads. The
 * homepage's cards used to point at `#trips`, an anchor on themselves, because
 * the mockup data they were built on had no addresses in it.
 */
export type TourCard = {
    slug: string;
    title: string;
    subtitle: string | null;
    region: string | null;
    ribbon_text: string | null;
    image_url: string | null;
    image_alt: string | null;
    /** From the CRM. Null when it cannot be reached. */
    starts_on: string | null;
    nights: number | null;
    price: number | null;
    booking_open: boolean | null;
    /** `2026-09`, for the month filter. */
    month: string | null;
};

/** Every published tour, for the homepage, the listing and the sitemap. */
export async function fetchTourCards(): Promise<TourCard[]> {
    try {
        const response = await fetch(`${origin}/api/site/tours`, {
            headers: { Accept: 'application/json' },
            next: { revalidate: REVALIDATE },
        });

        if (!response.ok) return [];

        const body = (await response.json()) as { data: TourCard[] };

        return body.data;
    } catch (error) {
        /*
         * Logged rather than silent. A homepage quietly showing the design's
         * mockup departures when real ones are published is the kind of fault
         * nobody reports, because the page looks fine.
         */
        console.error('[tours] could not reach Laravel for the tour list', error);

        return [];
    }
}
