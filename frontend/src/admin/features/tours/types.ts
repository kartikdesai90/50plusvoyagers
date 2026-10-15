/**
 * A group tour, as the admin works with it.
 *
 * `tour_code` and `tour_name` identify the page and join it to the CRM.
 * Everything after them is the page: its address, its prose, its meta tags,
 * its pictures.
 *
 * Price, dates, nights, category and deposit are read live from
 * `tb_group_tour` so a page can never disagree with the CRM about what a
 * tour costs — there is nothing here to edit.
 *
 * Mirrors `App\Http\Resources\Admin\TourResource`.
 */

export type TourCrm = {
    tour_code: string | null;
    starts_on: string | null;
    ends_on: string | null;
    nights: number | null;
    price: number | null;
    advance: number | null;
    category: string | null;
    /** tb_group_tour.tour_status, e.g. Active. */
    status: string | null;
    website_link: string | null;
    booking_open: boolean | null;
};

export type Tour = {
    id: number;

    tour_code: string;
    tour_name: string;

    /* The page. */
    slug: string | null;
    page_title: string | null;
    subtitle: string | null;
    summary: string | null;
    ribbon_text: string | null;
    /** The tour's own main picture. Null until an editor chooses one. */
    image_url: string | null;
    route_map_url: string | null;
    visa_content: string | null;

    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_title: string | null;
    og_description: string | null;
    og_image_url: string | null;
    canonical_url: string | null;

    display_order: number;

    /** The matching CRM departure, or null when this code has none upcoming. */
    crm: TourCrm | null;

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

    slug: string;
    page_title: string;
    subtitle: string;
    summary: string;
    ribbon_text: string;
    visa_content: string;

    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_title: string;
    og_description: string;
    canonical_url: string;

    display_order: string;
};
