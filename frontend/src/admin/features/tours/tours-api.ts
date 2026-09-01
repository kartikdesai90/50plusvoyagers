import { http } from '@/shared/lib/axios';
import type { Tour, TourInput, TourListResponse, TourQuery } from '@/admin/features/tours/types';

/**
 * The tour endpoints.
 *
 * Plain JSON, unlike the modules that carry a picture: a tour is five fields of
 * text and a date, so there is nothing multipart to send. The update is still a
 * POST rather than a PATCH, matching every other module — one rule for how the
 * panel saves is worth more than this one endpoint being tidier than its
 * neighbours, and it needs no change on the day a tour gains a photograph.
 */

const BASE = '/admin/tours';

type TourEnvelope = { data: Tour };

export async function listTours(query: TourQuery = {}): Promise<TourListResponse> {
    const { data } = await http.get<TourListResponse>(BASE, { params: query });

    return data;
}

export async function getTour(id: number): Promise<Tour> {
    const { data } = await http.get<TourEnvelope>(`${BASE}/${id}`);

    return data.data;
}

/**
 * An empty date has to travel as an empty string, not be dropped.
 *
 * Omitting the key would leave a tour's existing end date untouched on an edit,
 * which is not what clearing the field means.
 */
function payload(input: TourInput): TourInput {
    return {
        tour_code: input.tour_code.trim(),
        tour_name: input.tour_name.trim(),
        end_date: input.end_date,
    };
}

export async function createTour(input: TourInput): Promise<Tour> {
    const { data } = await http.post<TourEnvelope>(BASE, payload(input));

    return data.data;
}

export async function updateTour(id: number, input: TourInput): Promise<Tour> {
    const { data } = await http.post<TourEnvelope>(`${BASE}/${id}`, payload(input));

    return data.data;
}

export async function deleteTour(id: number): Promise<void> {
    await http.delete(`${BASE}/${id}`);
}
