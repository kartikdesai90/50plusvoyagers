/**
 * The homepage's "Who we are" cards, as the admin works with them.
 *
 * Mirrors `App\Http\Resources\Admin\WhoWeAreCardResource`. The section's own
 * heading and the line over it are not here and are not stored: they title the
 * section rather than saying anything that changes, so they live in the
 * component that draws it. What an editor maintains is the cards.
 */

export type WhoWeAreCard = {
    id: number;
    title: string;
    body: string | null;
    image_url: string | null;
    is_active: boolean;
    display_order: number;
};

/**
 * One card as the form holds it.
 *
 * The picture travels on the row rather than in a separate bag of files the way
 * the single-record forms carry theirs. There are several rows and they can be
 * reordered, so a file that lived anywhere but on its own row would be a file
 * that could end up on the wrong card.
 *
 * There is no `display_order` either. A card's position in this list is its
 * position on the homepage, and the server reads it that way — a number an
 * editor typed would be a second answer to a question the list already answers.
 */
export type CardInput = {
    /** Null on a card that has not been saved yet. */
    id: number | null;
    title: string;
    body: string;
    is_active: boolean;
    /** What is already stored, so the row can show it. Null on a new card. */
    image_url: string | null;
    /** Chosen but not yet uploaded. */
    image_file: File | null;
    /**
     * Stable across a reorder, so React follows a row rather than a position.
     * Never sent — the server knows a card by its id or by not having one.
     */
    key: string;
};
