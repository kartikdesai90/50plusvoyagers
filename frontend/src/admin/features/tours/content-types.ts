/**
 * A tour page's repeating blocks, as the admin works with them.
 *
 * Mirrors `App\Http\Resources\Admin\TourContentResource`.
 *
 * These are the seven lists the public page renders and that, until now, only
 * `php artisan tour:import` could write: the day-by-day, the highlights, what
 * the price covers and what it does not, and the three numbered lists about
 * booking.
 *
 * Every row carries its `id` where one exists. The public page has no use for
 * one — it prints the words — but this screen must be able to say "this row,
 * the one that already exists" when it saves. Without that a save would delete
 * the set and write it again, and every row would change identity on every
 * save.
 */

/** One row of an unnumbered list, as it is stored. */
export type TourListRow = {
    id: number;
    body: string;
};

/** One row of a numbered list. The number is shown but never edited. */
export type TourStepRow = {
    id: number;
    /** Recomputed from the row's position on every save. */
    number: number;
    body: string;
};

export type TourItineraryRow = {
    id: number;
    day_number: number;
    heading: string;
    title: string | null;
    body: string;
    stay: string | null;
    meals: string | null;
    /** `YYYY-MM-DD`, or null — normally null. See `DayInput.day_date`. */
    day_date: string | null;
};

export type TourContent = {
    tour_id: number;
    highlights: TourListRow[];
    inclusions: TourListRow[];
    exclusions: TourListRow[];
    itinerary: TourItineraryRow[];
    booking_steps: TourStepRow[];
    documents: TourStepRow[];
    guidelines: TourStepRow[];
};

/**
 * One row of any of the five flat lists, as the form holds it.
 *
 * There is no `display_order`. A row's position in its list is its position on
 * the page, and the server reads it that way — a number an editor typed would
 * be a second answer to a question the list already answers.
 */
export type LineInput = {
    /** Null on a row that has not been saved yet. */
    id: number | null;
    body: string;
    /**
     * Stable across a reorder, so React follows a row rather than a position.
     * Never sent — the server knows a row by its id or by not having one.
     */
    key: string;
};

/** One day of the itinerary, as the form holds it. */
export type DayInput = {
    id: number | null;
    heading: string;
    title: string;
    body: string;
    stay: string;
    meals: string;
    /**
     * Almost always empty. The real date is counted from the CRM's departure
     * plus the day number, so re-running the tour next year re-dates the whole
     * itinerary by itself. This is the override for the day that genuinely
     * needs one.
     */
    day_date: string;
    key: string;
};

/**
 * The whole page as the form holds it.
 *
 * The five flat lists and the itinerary, keyed exactly as the server names
 * them — so a 422 on `highlights.2.body` lands on the row at fault without
 * anything having to translate between two vocabularies.
 */
export type TourContentInput = {
    highlights: LineInput[];
    inclusions: LineInput[];
    exclusions: LineInput[];
    itinerary: DayInput[];
    booking_steps: LineInput[];
    documents: LineInput[];
    guidelines: LineInput[];
};

/** The five lists that are a paragraph and nothing else. */
export const FLAT_LISTS = [
    'highlights',
    'inclusions',
    'exclusions',
    'booking_steps',
    'documents',
    'guidelines',
] as const;

export type FlatListName = (typeof FLAT_LISTS)[number];
