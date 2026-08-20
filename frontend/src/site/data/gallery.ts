import { gallery } from '@/site/data/home';
import type { GalleryPhoto } from '@/site/types/gallery';

/**
 * The gallery as the design ships it, for a site with none stored.
 *
 * Not a second copy of the content: this is built from the same constant the
 * static homepage always used, and the seeder writes exactly the same words
 * into the database. What it buys is a homepage that still renders on a fresh
 * install, before anyone has signed in to the admin — the alternative is a page
 * with an empty band in the middle of it.
 *
 * Negative ids for the same reason the fallback bands use them: nothing that
 * came out of the database can ever collide with one.
 */
export const fallbackGallery: GalleryPhoto[] = gallery.map((photo, index) => ({
    id: -(index + 1),
    title: photo.place,
    caption: photo.note,
    image_url: photo.src,
    /* The caption, falling back to the place — the same order the server
       resolves it in. */
    image_alt: photo.note || photo.place,
}));
