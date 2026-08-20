/**
 * A hero slide or a banner band, as the server sends it.
 *
 * Mirrors `App\Http\Resources\Site\HeroBannerResource` exactly. Note what is
 * absent: whether the band is switched off, and where it sits in the order.
 * Both are decisions the server has already applied — a band that arrives here
 * is one that is meant to be on the page, in the position it arrived in.
 *
 * There is no kind of media either. A band shows a picture; it used to be able
 * to show a film instead, and nothing that reads a band has to ask any more.
 */

/** The words printed over a hero photograph. Only the lead band's is drawn. */
export type BandCaption = {
    label: string | null;
    heading: string | null;
    text: string | null;
    button: { text: string; url: string } | null;
};

export type Band = {
    id: number;
    media_url: string;
    /** Derived from the band's heading; nothing is stored beside the picture. */
    media_alt: string;
    label: string | null;
    heading: string;
    description: string | null;
    button: { text: string; url: string } | null;
    /** Null where an editor wrote none, so the hero draws nothing. */
    caption: BandCaption | null;
};
