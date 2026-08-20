/**
 * A piece of feedback, as the admin works with it.
 *
 * Mirrors `App\Http\Resources\Admin\FeedbackResource`. Disks and stored paths
 * are deliberately absent — an editor works with a file they can see, and where
 * the bytes live is the server's business.
 */

export type FeedbackType = 'text' | 'video';

export type Feedback = {
    id: number;
    type: FeedbackType;
    type_label: string;

    customer_name: string;
    customer_location: string | null;
    feedback_text: string | null;

    video_url: string | null;
    /** Where the film actually is, whichever way it arrived. */
    video_source: string | null;
    video_is_uploaded: boolean;

    thumbnail_url: string | null;

    photo_url: string | null;

    tour_id: number | null;

    is_featured: boolean;
    is_active: boolean;
    display_order: number;

    created_at: string | null;
    updated_at: string | null;
};

export type FeedbackChoices = {
    types: { value: FeedbackType; label: string; description: string }[];
    /** Empty until the Tours module exists; the screen hides its picker then. */
    tours: { id: number; name: string }[];
};

export type FeedbackListResponse = {
    data: Feedback[];
    meta: FeedbackChoices & {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type FeedbackQuery = {
    search?: string;
    type?: string;
    status?: string;
    tour_id?: number | '';
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
};

/** What the form holds. Files travel separately — they are not text. */
export type FeedbackInput = {
    type: FeedbackType;
    customer_name: string;
    customer_location: string;
    feedback_text: string;
    video_url: string;
    tour_id: string;
    is_featured: boolean;
    is_active: boolean;
    display_order: number;
};

/** The three files a piece of feedback can carry. */
export type FeedbackFiles = {
    video_file: File | null;
    thumbnail_file: File | null;
    photo_file: File | null;
};
