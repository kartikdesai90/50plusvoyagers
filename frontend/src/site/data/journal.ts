import { posts } from '@/site/data/blog';
import type { JournalCard, JournalPost } from '@/site/types/journal';

/**
 * The journal as the design ships it, for a site with none stored.
 *
 * Not a second copy of the content: these are built from the same constant the
 * static journal always used, and the seeder writes exactly the same articles
 * into the database. What they buy is a site that still renders on a fresh
 * install, before anyone has signed in to the admin — the alternative is a
 * homepage with an empty band and a journal index with nothing in it.
 *
 * Negative ids for the same reason the fallback bands use them: nothing that
 * came out of the database can ever collide with one.
 */

export const fallbackPosts: JournalPost[] = posts.map((post, index) => ({
    id: -(index + 1),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    author: post.author,
    date: post.date,
    reading_time: post.readingTime,
    image_url: post.image,
    image_alt: post.title,
    is_featured: post.featured ?? false,
    body: post.body,
    tags: [],
    meta_title: null,
    meta_description: null,
    canonical_url: null,
}));

/** The categories these articles are actually filed under, for the index. */
export const fallbackCategories: string[] = [
    ...new Set(fallbackPosts.map((post) => post.category).filter((name) => name !== null)),
].sort();

/**
 * Up to three others, preferring the same category — the same rule the server
 * applies, so the strip under an article reads the same either way.
 */
export function fallbackRelated(post: JournalPost, limit = 3): JournalCard[] {
    const others = fallbackPosts.filter((candidate) => candidate.slug !== post.slug);

    return [
        ...others.filter((candidate) => candidate.category === post.category),
        ...others.filter((candidate) => candidate.category !== post.category),
    ].slice(0, limit);
}
