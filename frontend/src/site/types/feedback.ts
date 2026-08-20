/**
 * What one traveller said, as the server sends it.
 *
 * Mirrors `App\Http\Resources\Site\FeedbackResource` exactly. Note what is
 * absent: whether the record is switched off, where it sits in the order, and
 * which tour it is filed against. All are decisions the server has already
 * applied — a quote that arrives here is one that is meant to be on the page,
 * in the position it arrived in.
 */
export type Feedback = {
    id: number;
    type: 'text' | 'video';
    name: string;
    /** The trip and year on a written quote; the role on a filmed one. */
    context: string | null;
    /** The words themselves. Always present on a written quote. */
    quote: string | null;
    /** Wherever the film actually lives, uploaded or linked. */
    video_source: string | null;
    thumbnail_url: string | null;
    photo_url: string | null;
    /** The films row renders its featured card taller. */
    is_featured: boolean;
};
