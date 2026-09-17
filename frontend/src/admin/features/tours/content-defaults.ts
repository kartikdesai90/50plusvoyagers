import type {
    DayInput,
    LineInput,
    TourContent,
    TourContentInput,
} from '@/admin/features/tours/content-types';

/**
 * A key React can follow a row by through a reorder.
 *
 * Not the row's id: a row that has never been saved has no id, and two new rows
 * would then share the key `null` and swap contents behind React's back. Not
 * the index either, for the same reason in reverse — moving a row would move
 * what React thinks is in it.
 *
 * `crypto.randomUUID` where the browser has it, which is every browser the
 * panel supports; the counter is for the server render and for an insecure
 * origin, where it is absent.
 */
let counter = 0;

function newKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    counter += 1;

    return `row-${counter}`;
}

/** A row an editor has just added. */
export function blankLine(): LineInput {
    return { id: null, body: '', key: newKey() };
}

/** A day an editor has just added. */
export function blankDay(): DayInput {
    return {
        id: null,
        heading: '',
        title: '',
        body: '',
        stay: '',
        meals: '',
        day_date: '',
        key: newKey(),
    };
}

/** The form's starting state for a tour whose content has not loaded yet. */
export const emptyContent: TourContentInput = {
    highlights: [],
    inclusions: [],
    exclusions: [],
    itinerary: [],
    booking_steps: [],
    documents: [],
    guidelines: [],
};

/**
 * Stored content, in the shape the form edits.
 *
 * Every nullable column becomes an empty string, because an input has no other
 * kind — and an input handed `null` is an uncontrolled input, which React
 * complains about and which loses what is typed into it.
 */
export function toContentInput(content: TourContent): TourContentInput {
    const line = (row: { id: number; body: string }): LineInput => ({
        id: row.id,
        body: row.body,
        key: newKey(),
    });

    return {
        highlights: content.highlights.map(line),
        inclusions: content.inclusions.map(line),
        exclusions: content.exclusions.map(line),
        booking_steps: content.booking_steps.map(line),
        documents: content.documents.map(line),
        guidelines: content.guidelines.map(line),

        itinerary: content.itinerary.map((day) => ({
            id: day.id,
            heading: day.heading,
            title: day.title ?? '',
            body: day.body,
            stay: day.stay ?? '',
            meals: day.meals ?? '',
            day_date: day.day_date ?? '',
            key: newKey(),
        })),
    };
}

/**
 * How much of a tour page has been written, for the tab strip.
 *
 * An editor arriving at a half-migrated tour wants to know which sections still
 * need work before they open them, not after.
 */
export function countOf(input: TourContentInput): number {
    return (
        input.highlights.length +
        input.inclusions.length +
        input.exclusions.length +
        input.itinerary.length +
        input.booking_steps.length +
        input.documents.length +
        input.guidelines.length
    );
}
