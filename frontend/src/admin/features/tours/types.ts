/**
 * A group tour, as the admin works with it.
 *
 * Mirrors `App\Http\Resources\Admin\TourResource` — five fields, matching the
 * client's CRM table exactly.
 *
 * What is deliberately absent is everything a tour *card* needs: a price, a
 * departure date, a duration, a photograph. Those are not in the CRM's `tours`
 * table, so they are not invented here. Until they are agreed and added, the
 * public homepage stays on its own catalogue and this module is the record of
 * a tour rather than the page for one.
 */

export type Tour = {
    id: number;
    /** The CRM's identifier for a departure — `Coorg30052026`. Unique. */
    tour_code: string;
    tour_name: string;
    /** `YYYY-MM-DD`, or null: the CRM has this nullable. */
    end_date: string | null;
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

/** What the form holds. Every field a string — an input has no other kind. */
export type TourInput = {
    tour_code: string;
    tour_name: string;
    end_date: string;
};
