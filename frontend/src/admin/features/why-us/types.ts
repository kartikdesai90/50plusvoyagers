/**
 * The homepage's "Why travel with us" band, as the admin works with it.
 *
 * Mirrors `App\Http\Resources\Admin\WhyUsSectionResource`. Flat where the site's
 * view of the same row is assembled into a button and a caption: a form edits
 * fields, so it receives fields.
 *
 * The band's heading and the small line over it are not here. They are the
 * design's words rather than the business's, so they are not stored and not
 * editable — they live in the component that draws the section.
 */

export type WhyUsSection = {
    /** As they were written, blank rows included. */
    points: string[];

    button_text: string | null;
    button_url: string | null;

    /** Where the stored picture is served from, so the screen can show it. */
    image_url: string | null;

    caption_heading: string | null;
    caption_text: string | null;

    /** Null until the band has been saved for the first time. */
    updated_at: string | null;
};

/**
 * What the form holds.
 *
 * Every text value is a string rather than `string | null`, for the reason the
 * settings form's are: a field's empty state is an empty string, and letting
 * null in would mean every input needing a `?? ''` at the point it is read. The
 * server turns the empty ones back into nulls on the way in.
 *
 * The picture travels separately — it is not text.
 */
export type WhyUsInput = {
    points: string[];

    button_text: string;
    button_url: string;


    caption_heading: string;
    caption_text: string;
};

/** The one picture the band holds. */
export type WhyUsFiles = {
    image_file: File | null;
};
