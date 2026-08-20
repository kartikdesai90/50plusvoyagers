/**
 * One card under "Who we are" on the homepage, as the server sends it.
 *
 * Mirrors `App\Http\Resources\Site\WhoWeAreCardResource` exactly. Note what is
 * absent: whether the card is switched off, and where it sits in the order.
 * Both are decisions the server has already applied — a card that arrives here
 * is one that is meant to be on the page, in the position it arrived in.
 *
 * The section's own heading and the line over it are absent for a different
 * reason: they were never stored. They title the section rather than saying
 * anything that changes, so they live in the component.
 */
export type WhoWeAreCard = {
    id: number;
    title: string;
    body: string | null;
    image_url: string;
    /** Derived from the card's title on the server, so it is never empty. */
    image_alt: string;
};
