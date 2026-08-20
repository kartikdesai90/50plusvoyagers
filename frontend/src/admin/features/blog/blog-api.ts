import { http } from '@/shared/lib/axios';
import type { BlogInput, BlogListResponse, BlogPost, BlogQuery } from '@/admin/features/blog/types';

/**
 * The journal endpoints.
 *
 * Every write is multipart, because every write may carry a featured image.
 * Sending JSON when there is none and multipart when there is would give the
 * module two request shapes and two ways for the server to read the same form.
 */

const BASE = '/admin/blog';

type PostEnvelope = { data: BlogPost };

export async function listPosts(query: BlogQuery = {}): Promise<BlogListResponse> {
    const { data } = await http.get<BlogListResponse>(BASE, { params: query });

    return data;
}

export async function getPost(id: number): Promise<BlogPost> {
    const { data } = await http.get<PostEnvelope>(`${BASE}/${id}`);

    return data.data;
}

function toFormData(input: BlogInput, file: File | null): FormData {
    const form = new FormData();

    for (const [key, value] of Object.entries(input)) {
        if (key === 'tags') continue;

        // Booleans have to cross as something PHP reads as a boolean; `false`
        // would arrive as the string "false", which is true to everything.
        form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }

    // An array crosses as repeated keys, which is what PHP reads back as one.
    for (const tag of input.tags) {
        form.append('tags[]', tag);
    }

    if (file) form.append('image_file', file);

    return form;
}

export async function createPost(input: BlogInput, file: File | null): Promise<BlogPost> {
    const { data } = await http.post<PostEnvelope>(BASE, toFormData(input, file));

    return data.data;
}

/**
 * A POST, not a PATCH: PHP does not parse a multipart body on any other
 * method, so an update carrying a replacement picture has nowhere to arrive.
 */
export async function updatePost(
    id: number,
    input: BlogInput,
    file: File | null,
): Promise<BlogPost> {
    const { data } = await http.post<PostEnvelope>(`${BASE}/${id}`, toFormData(input, file));

    return data.data;
}

export async function deletePost(id: number): Promise<void> {
    await http.delete(`${BASE}/${id}`);
}
