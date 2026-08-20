import { films, toasts } from '@/site/data/home';
import type { Feedback } from '@/site/types/feedback';

/**
 * The two feedback bands as the design ships them, for a site with none stored.
 *
 * Not a second copy of the content: these are built from the same constants the
 * static homepage always used, and the seeder writes exactly the same words into
 * the database. What they buy is a homepage that still renders on a fresh
 * install, before anyone has signed in to the admin — the alternative is a page
 * with two empty bands in the middle of it.
 *
 * Negative ids for the same reason the fallback bands use them: nothing that
 * came out of the database can ever collide with one, so a key clash is not
 * possible even if the two lists were ever rendered together.
 */

export const fallbackToasts: Feedback[] = toasts.map((toast, index) => ({
    id: -(index + 1),
    type: 'text',
    name: toast.name,
    context: toast.trip,
    quote: toast.body,
    video_source: null,
    thumbnail_url: null,
    photo_url: toast.src,
    is_featured: false,
}));

export const fallbackFilms: Feedback[] = films.map((film, index) => ({
    id: -(index + 1),
    type: 'video',
    name: film.name,
    context: film.role,
    quote: null,
    /* The design ships the stills, not the films themselves. */
    video_source: null,
    thumbnail_url: film.src,
    photo_url: null,
    is_featured: film.featured ?? false,
}));
