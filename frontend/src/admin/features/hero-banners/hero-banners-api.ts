import { http } from '@/shared/lib/axios';
import type {
    HeroBanner,
    HeroBannerInput,
    HeroBannerListResponse,
} from '@/admin/features/hero-banners/types';

/**
 * The homepage band endpoints.
 *
 * Every write is multipart, because every write may carry a file. Sending JSON
 * when there is no new file and multipart when there is would give the module
 * two request shapes and two ways for the server to read the same form.
 */

const BASE = '/admin/hero-banners';

type BandEnvelope = { data: HeroBanner };

export async function listHeroBanners(): Promise<HeroBannerListResponse> {
    const { data } = await http.get<HeroBannerListResponse>(BASE);

    return data;
}

/** One band, for the edit screen to fill its form from. */
export async function getHeroBanner(id: number): Promise<HeroBanner> {
    const { data } = await http.get<BandEnvelope>(`${BASE}/${id}`);

    return data.data;
}

function toFormData(input: HeroBannerInput, file: File | null): FormData {
    const form = new FormData();

    for (const [key, value] of Object.entries(input)) {
        // Booleans have to cross as something PHP reads as a boolean; `false`
        // would arrive as the string "false", which is true to everything.
        form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }

    if (file) form.append('media_file', file);

    return form;
}

export async function createHeroBanner(
    input: HeroBannerInput,
    file: File | null,
): Promise<HeroBanner> {
    const { data } = await http.post<BandEnvelope>(BASE, toFormData(input, file));

    return data.data;
}

/**
 * A POST, not a PATCH: PHP does not parse a multipart body on any other
 * method, so an update carrying a replacement file has nowhere to arrive.
 */
export async function updateHeroBanner(
    id: number,
    input: HeroBannerInput,
    file: File | null,
): Promise<HeroBanner> {
    const { data } = await http.post<BandEnvelope>(`${BASE}/${id}`, toFormData(input, file));

    return data.data;
}

export async function deleteHeroBanner(id: number): Promise<void> {
    await http.delete(`${BASE}/${id}`);
}
