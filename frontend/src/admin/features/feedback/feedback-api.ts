import { http } from '@/shared/lib/axios';
import type {
    Feedback,
    FeedbackFiles,
    FeedbackInput,
    FeedbackListResponse,
    FeedbackQuery,
} from '@/admin/features/feedback/types';

/**
 * The feedback endpoints.
 *
 * Every write is multipart, because every write may carry a file. Sending JSON
 * when there is none and multipart when there is would give the module two
 * request shapes and two ways for the server to read the same form.
 */

const BASE = '/admin/feedback';

type FeedbackEnvelope = { data: Feedback };

export async function listFeedback(query: FeedbackQuery = {}): Promise<FeedbackListResponse> {
    const { data } = await http.get<FeedbackListResponse>(BASE, { params: query });

    return data;
}

export async function getFeedback(id: number): Promise<Feedback> {
    const { data } = await http.get<FeedbackEnvelope>(`${BASE}/${id}`);

    return data.data;
}

function toFormData(input: FeedbackInput, files: FeedbackFiles): FormData {
    const form = new FormData();

    for (const [key, value] of Object.entries(input)) {
        // Booleans have to cross as something PHP reads as a boolean; `false`
        // would arrive as the string "false", which is true to everything.
        form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }

    for (const [key, file] of Object.entries(files)) {
        if (file) form.append(key, file);
    }

    return form;
}

export async function createFeedback(
    input: FeedbackInput,
    files: FeedbackFiles,
): Promise<Feedback> {
    const { data } = await http.post<FeedbackEnvelope>(BASE, toFormData(input, files));

    return data.data;
}

/**
 * A POST, not a PATCH: PHP does not parse a multipart body on any other
 * method, so an update carrying a replacement file has nowhere to arrive.
 */
export async function updateFeedback(
    id: number,
    input: FeedbackInput,
    files: FeedbackFiles,
): Promise<Feedback> {
    const { data } = await http.post<FeedbackEnvelope>(`${BASE}/${id}`, toFormData(input, files));

    return data.data;
}

export async function deleteFeedback(id: number): Promise<void> {
    await http.delete(`${BASE}/${id}`);
}
