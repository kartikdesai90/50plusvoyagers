/**
 * A journal post, as the admin works with it.
 *
 * Mirrors `App\Http\Resources\Admin\BlogPostResource`. Reading time and whether
 * the post is actually live are computed on the server, so the list, the form
 * and the public site cannot disagree about either.
 */

export type PostStatus = 'draft' | 'published';

export type BlogPost = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;

    image_url: string | null;

    category: string | null;
    tags: string[];
    /** The staff member who filed it. */
    author_id: number | null;
    /** Their name, when the list asked for it. */
    staff_name: string | null;
    /** The credit an editor typed, for a post a member of the club wrote. */
    author_name: string | null;
    /** What actually appears under the title — resolved on the server. */
    byline: string;

    meta_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;

    is_featured: boolean;
    status: PostStatus;
    /** Already phrased for a person — "Draft", "Published" or "Scheduled". */
    status_label: string;
    is_live: boolean;
    published_at: string | null;
    display_order: number;

    reading_minutes: number;
    public_path: string;

    created_at: string | null;
    updated_at: string | null;
};

export type BlogChoices = {
    statuses: { value: PostStatus; label: string; description: string }[];
    /** Assembled from what has actually been used, not a maintained list. */
    categories: string[];
    authors: { id: number; name: string }[];
};

export type BlogListResponse = {
    data: BlogPost[];
    meta: BlogChoices & {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type BlogQuery = {
    search?: string;
    status?: string;
    category?: string;
    featured?: string;
    from?: string;
    to?: string;
    sort?: string;
    page?: number;
};

/** What the form holds. The picture travels separately — it is not text. */
export type BlogInput = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
    author_id: string;
    author_name: string;
    meta_title: string;
    meta_description: string;
    canonical_url: string;
    is_featured: boolean;
    status: PostStatus;
    published_at: string;
    display_order: number;
};
