/**
 * A gallery photograph, as the admin works with it.
 *
 * Mirrors `App\Http\Resources\Admin\GalleryItemResource`. The disk and stored
 * path are deliberately absent — an editor works with a picture they can see.
 */

export type GalleryItem = {
    id: number;
    title: string;
    caption: string | null;
    image_url: string;
    /** What a screen reader announces, after the caption fallback is applied. */
    described_as: string;
    tour_id: number | null;
    is_featured: boolean;
    is_active: boolean;
    display_order: number;
    created_at: string | null;
    updated_at: string | null;
};

export type GalleryChoices = {
    /** Empty until the Tours module exists; the screen hides its picker then. */
    tours: { id: number; name: string }[];
};

export type GalleryListResponse = {
    data: GalleryItem[];
    meta: GalleryChoices & {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type GalleryQuery = {
    search?: string;
    status?: string;
    tour_id?: number | '';
    featured?: string;
    sort?: string;
    page?: number;
};

/** What the form holds. The picture travels separately — it is not text. */
export type GalleryInput = {
    title: string;
    caption: string;
    tour_id: string;
    is_featured: boolean;
    is_active: boolean;
    display_order: number;
};
