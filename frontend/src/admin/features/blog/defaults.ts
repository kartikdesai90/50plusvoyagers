import type { BlogInput, BlogPost } from '@/admin/features/blog/types';

/**
 * What the form starts as when a post is being written.
 *
 * A draft, unfeatured, with no publish date — a post begins as something being
 * written, and going live is a decision taken afterwards.
 */
export const blankPost: BlogInput = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    author_id: '',
    author_name: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    is_featured: false,
    status: 'draft',
    published_at: '',
    display_order: 0,
};

/** An existing post, in the shape the form edits. */
export function toInput(post: BlogPost): BlogInput {
    return {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        category: post.category ?? '',
        tags: post.tags,
        author_id: post.author_id === null ? '' : String(post.author_id),
        author_name: post.author_name ?? '',
        meta_title: post.meta_title ?? '',
        meta_description: post.meta_description ?? '',
        canonical_url: post.canonical_url ?? '',
        is_featured: post.is_featured,
        status: post.status,
        published_at: toLocalMoment(post.published_at),
        display_order: post.display_order,
    };
}

/** The same address the server would write, so the field is never a surprise. */
export function toSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** What a date-and-time field expects: the moment as this browser reads it. */
function toLocalMoment(value: string | null): string {
    if (!value) return '';

    const moment = new Date(value);
    const offset = moment.getTimezoneOffset() * 60_000;

    return new Date(moment.getTime() - offset).toISOString().slice(0, 16);
}
