import { PhotoRail } from '@/site/components/photo-rail';
import type { GalleryPhoto } from '@/site/types/gallery';
import type { TourView } from '@/site/data/tour-view';

type Photo = TourView['images'][number];

/**
 * The tour's own photographs.
 *
 * These are the only pictures on the page taken on the trip itself, which makes
 * them the most persuasive thing on it.
 *
 * The row is {@see PhotoRail} — the homepage band's component, not a copy of
 * it. This used to be its own implementation and had drifted twice: first over
 * the card, which printed no title and dimmed its scrim differently from the
 * identical picture two pages away, and then over the row, which was a wrapping
 * grid where the homepage scrolled. Sharing the component is what stops a third
 * drift.
 *
 * Every photograph is in the set, the cover included. The hero crops the same
 * picture full-bleed and panoramic, so seeing it again in the row reads as the
 * set it belongs to rather than as a repeat.
 */
export function TourGallery({ photos, title }: { photos: Photo[]; title: string }) {
    if (photos.length === 0) return null;

    /*
     * The rail speaks the gallery's shape, so the tour's photographs are
     * translated into it rather than the rail being taught a second one. `id`
     * is the index because these rows are not the gallery's records and carry
     * no id of their own.
     *
     * Title and caption stay two fields, as they are everywhere else. They were
     * briefly collapsed into one — the caption promoted into the title slot and
     * the caption blanked — because the server was not sending the title at
     * all, so there was only ever one line to print. That was the bug: the same
     * photograph showed a heading and a line beneath it on the gallery page,
     * and a single line here.
     *
     * The tour's own name stands in where a photograph was filed without a
     * title, so the card is never headed by nothing.
     */
    const asGallery: GalleryPhoto[] = photos.map((photo, index) => ({
        id: index,
        title: photo.title || title,
        caption: photo.caption,
        image_url: photo.url,
        image_alt: photo.alt,
    }));

    return <PhotoRail photos={asGallery} label="Photographs from this tour" />;
}
