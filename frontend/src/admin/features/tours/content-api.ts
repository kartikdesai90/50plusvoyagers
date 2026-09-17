import { http } from '@/shared/lib/axios';
import type { TourContent, TourContentInput } from '@/admin/features/tours/content-types';

/**
 * A tour's repeating content.
 *
 * Two endpoints, not five, though these are rows rather than a single record:
 * the lists are read as a group and written as a group. A save sends the whole
 * page — what is in it is what the page becomes, and a row left out of it is a
 * row taken off the page.
 *
 * Separate from the tour's own save because it is a separate sitting:
 * correcting a tour code takes a moment, writing thirteen days does not.
 *
 * JSON rather than multipart, unlike every other module here. None of these
 * rows carries a file — the carousel is `gallery_items` and is managed with the
 * photographs — so there is nothing multipart would buy, and the nested arrays
 * survive the trip unflattened.
 */

const base = (tourId: number) => `/admin/tours/${tourId}/content`;

type Envelope = { data: TourContent };

export async function getTourContent(tourId: number): Promise<TourContent> {
    const { data } = await http.get<Envelope>(base(tourId));

    return data.data;
}

/**
 * What is actually sent.
 *
 * The `key` each row carries is dropped: it exists so React can follow a row
 * through a reorder, and the server knows a row by its id or by not having one.
 *
 * An id of `null` is omitted rather than sent as null — a new row is new by
 * having no id, rather than by carrying an empty one the server has to read.
 */
function toPayload(input: TourContentInput): Record<string, unknown> {
    const line = (row: { id: number | null; body: string }) => ({
        ...(row.id === null ? {} : { id: row.id }),
        body: row.body,
    });

    return {
        highlights: input.highlights.map(line),
        inclusions: input.inclusions.map(line),
        exclusions: input.exclusions.map(line),
        booking_steps: input.booking_steps.map(line),
        documents: input.documents.map(line),
        guidelines: input.guidelines.map(line),

        itinerary: input.itinerary.map((day) => ({
            ...(day.id === null ? {} : { id: day.id }),
            heading: day.heading,
            title: day.title,
            body: day.body,
            stay: day.stay,
            meals: day.meals,
            day_date: day.day_date,
        })),
    };
}

export async function saveTourContent(
    tourId: number,
    input: TourContentInput,
): Promise<TourContent> {
    const { data } = await http.post<Envelope>(base(tourId), toPayload(input));

    return data.data;
}
