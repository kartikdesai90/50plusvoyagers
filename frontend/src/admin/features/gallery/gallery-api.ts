import { http } from '@/shared/lib/axios';
import type {
    GalleryInput,
    GalleryItem,
    GalleryListResponse,
    GalleryQuery,
} from '@/admin/features/gallery/types';

/**
 * The gallery endpoints.
 *
 * Every write is multipart, because every write may carry a picture. Sending
 * JSON when there is none and multipart when there is would give the module two
 * request shapes and two ways for the server to read the same form.
 */

const BASE = '/admin/gallery';

type GalleryEnvelope = { data: GalleryItem };

export async function listGallery(query: GalleryQuery = {}): Promise<GalleryListResponse> {
    const { data } = await http.get<GalleryListResponse>(BASE, { params: query });

    return data;
}

export async function getGalleryItem(id: number): Promise<GalleryItem> {
    const { data } = await http.get<GalleryEnvelope>(`${BASE}/${id}`);

    return data.data;
}

function toFormData(input: GalleryInput, file: File | null): FormData {
    const form = new FormData();

    for (const [key, value] of Object.entries(input)) {
        // Booleans have to cross as something PHP reads as a boolean; `false`
        // would arrive as the string "false", which is true to everything.
        form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }

    if (file) form.append('image_file', file);

    return form;
}

export async function createGalleryItem(
    input: GalleryInput,
    file: File | null,
): Promise<GalleryItem> {
    const { data } = await http.post<GalleryEnvelope>(BASE, toFormData(input, file));

    return data.data;
}

/**
 * A POST, not a PATCH: PHP does not parse a multipart body on any other
 * method, so an update carrying a replacement picture has nowhere to arrive.
 */
export async function updateGalleryItem(
    id: number,
    input: GalleryInput,
    file: File | null,
): Promise<GalleryItem> {
    const { data } = await http.post<GalleryEnvelope>(`${BASE}/${id}`, toFormData(input, file));

    return data.data;
}

export async function deleteGalleryItem(id: number): Promise<void> {
    await http.delete(`${BASE}/${id}`);
}
