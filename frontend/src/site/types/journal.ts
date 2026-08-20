/**
 * The journal, as the server sends it.
 *
 * Mirrors `App\Http\Resources\Site\BlogPostCardResource` and the fuller
 * `BlogPostResource` built on it. Three fields arrive already phrased rather
 * than raw — the date, the reading time and the byline — because each is a
 * decision, and a decision made once on the server is one the homepage row, the
 * index and the article itself cannot make differently from each other.
 *
 * A draft, or a post scheduled for next week, never reaches either type: the
 * server decides what "published" means and only sends what is.
 */

/** One article as a card: the listing's view of it, and the homepage's. */
export type JournalCard = {
    id: number;
    /** What comes after /blog/ in the link. */
    slug: string;
    title: string;
    excerpt: string;
    /** Absent where an editor filed the post under nothing. */
    category: string | null;
    /** Whoever the article is credited to. Always something. */
    author: string;
    /** Already a date a reader reads: "12 Dec 2025". */
    date: string;
    /** Already a phrase: "7 min read". */
    reading_time: string;
    image_url: string | null;
    /** Derived from the post's title; nothing is stored beside the picture. */
    image_alt: string;
    /** The index gives its lead article the full-width treatment. */
    is_featured: boolean;
};

/** One article in full, as its own page receives it. */
export type JournalPost = JournalCard & {
    /** The prose, as paragraphs. Never markup — the page prints text. */
    body: string[];
    tags: string[];
    /** For the page's own head. Null where an editor wrote nothing. */
    meta_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
};
