/**
 * The homepage's "Why travel with us" band, as the server sends it.
 *
 * Mirrors `App\Http\Resources\Site\WhyUsSectionResource` exactly. Note what is
 * absent: the band's own heading and the small line over it. Those are the
 * design's words rather than the business's — they title the section rather
 * than saying anything that changes — so they live in the component, next to
 * the layout they title. What arrives here is what an editor maintains.
 *
 * The band arrives whole or not at all. There is one of it, so where a set
 * would say "nothing stored" by being empty, this says it by being null, and
 * the homepage falls back to what the design ships with.
 */

/** The words printed over the bottom of the photograph. */
export type WhyUsCaption = {
    heading: string | null;
    text: string | null;
};

export type WhyUs = {
    /** The ticked list, in the order it is shown. Empty where none was written. */
    points: string[];
    button: { text: string; url: string } | null;
    image: {
        url: string;
        /** Empty where the picture is decorative, which is how it is declared. */
        alt: string;
    };
    /** Null where an editor wrote none, so the band draws no scrim. */
    caption: WhyUsCaption | null;
};
