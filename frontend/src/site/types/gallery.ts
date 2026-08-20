/**
 * One photograph, as the server sends it.
 *
 * Mirrors `App\Http\Resources\Site\GalleryItemResource` exactly. Note what is
 * absent: whether the record is switched off, where it sits in the order, and
 * which tour it is filed against. All are decisions the server has already
 * applied — a photograph that arrives here is one that is meant to be on the
 * page, in the position it arrived in.
 */
export type GalleryPhoto = {
    id: number;
    /** The place, printed over the picture. */
    title: string;
    /** The line underneath it. Absent where an editor wrote none. */
    caption: string | null;
    image_url: string | null;
    /** Derived from the caption or the title; nothing is stored beside the
        picture, so the two can never disagree. */
    image_alt: string;
};
