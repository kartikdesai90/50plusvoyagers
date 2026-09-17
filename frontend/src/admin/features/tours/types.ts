/**
 * A group tour, as the admin works with it.
 *
 * Two things side by side. The CRM's five fields (`tour_code`, `tour_name`,
 * `end_date` and the timestamps) are the client's own table, carried across
 * unchanged. Everything after them is the page: its address, its prose, its
 * meta tags, its pictures.
 *
 * What is deliberately absent is price, departure date, nights and booking
 * state. Those are read live from `tb_group_tour` so a page can never disagree
 * with the CRM about what a tour costs — there is nothing here to edit.
 *
 * Mirrors `App\Http\Resources\Admin\TourResource`.
 */

export type Tour = {
    id: number;

    /* The CRM's five. */
    tour_code: string;
    tour_name: string;
    /** `YYYY-MM-DD`, or null: the CRM has this nullable. */
    end_date: string | null;

    /* The page. */
    slug: string | null;
    legacy_url: string | null;
    page_title: string | null;
    subtitle: string | null;
    region: string | null;
    summary: string | null;
    ribbon_text: string | null;
    /** The tour's own main picture. Null until an editor chooses one. */
    image_url: string | null;
    route_map_url: string | null;
    visa_content: string | null;
    booking_fee: number | null;
    balance_due_days: number | null;

    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    canonical_url: string | null;

    status: string;
    display_order: number;

    /** How much of the page exists. Present on the list screen only. */
    counts?: {
        images: number;
        highlights: number;
        itinerary_days: number;
        inclusions: number;
        exclusions: number;
    };

    created_at: string | null;
    updated_at: string | null;
};

export type TourListResponse = {
    data: Tour[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type TourQuery = {
    search?: string;
    sort?: string;
    direction?: string;
    page?: number;
};

/**
 * What the form holds.
 *
 * Every field a string, because an input has no other kind — the numbers are
 * parsed on the way out rather than juggled as `number | ''` on the way in.
 */
export type TourInput = {
    tour_code: string;
    tour_name: string;
    end_date: string;

    slug: string;
    legacy_url: string;
    page_title: string;
    subtitle: string;
    region: string;
    summary: string;
    ribbon_text: string;
    visa_content: string;
    booking_fee: string;
    balance_due_days: string;

    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_title: string;
    og_description: string;
    canonical_url: string;

    status: string;
    display_order: string;
};
