import { http } from '@/shared/lib/axios';
import type { Tour, TourInput, TourListResponse, TourQuery } from '@/admin/features/tours/types';

/**
 * The tour endpoints.
 *
 * Multipart on every write, because a write may carry the main image, the route
 * map or the social image. Sending JSON when there is no file and multipart when
 * there is would give the module two request shapes and the server two ways to
 * read the same form.
 *
 * The update is a POST rather than a PATCH for the same reason every other
 * module's is: PHP does not parse a multipart body on any other method.
 */

const BASE = '/admin/tours';

type TourEnvelope = { data: Tour };

/** The three pictures a tour itself carries. */
export type TourFiles = {
    image_file?: File | null;
    route_map_file?: File | null;
    og_image_file?: File | null;
};

export async function listTours(query: TourQuery = {}): Promise<TourListResponse> {
    const { data } = await http.get<TourListResponse>(BASE, { params: query });

    return data;
}

export async function getTour(id: number): Promise<Tour> {
    const { data } = await http.get<TourEnvelope>(`${BASE}/${id}`);

    return data.data;
}

function toFormData(input: TourInput, files: TourFiles): FormData {
    const form = new FormData();

    for (const [key, value] of Object.entries(input)) {
        /*
         * An empty string is sent, not skipped. Laravel's
         * ConvertEmptyStringsToNull turns it into null on arrival, which is
         * what clearing a field means — omitting the key would instead leave
         * the stored value untouched.
         */
        form.append(key, value);
    }

    if (files.image_file) form.append('image_file', files.image_file);
    if (files.route_map_file) form.append('route_map_file', files.route_map_file);
    if (files.og_image_file) form.append('og_image_file', files.og_image_file);

    return form;
}

export async function createTour(input: TourInput, files: TourFiles = {}): Promise<Tour> {
    const { data } = await http.post<TourEnvelope>(BASE, toFormData(input, files));

    return data.data;
}

export async function updateTour(
    id: number,
    input: TourInput,
    files: TourFiles = {},
): Promise<Tour> {
    const { data } = await http.post<TourEnvelope>(`${BASE}/${id}`, toFormData(input, files));

    return data.data;
}

export async function deleteTour(id: number): Promise<void> {
    await http.delete(`${BASE}/${id}`);
}
