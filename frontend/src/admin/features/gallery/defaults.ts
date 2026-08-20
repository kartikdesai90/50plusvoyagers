import type { GalleryInput, GalleryItem } from '@/admin/features/gallery/types';

/** What the form starts as when a photograph is being added. */
export const blankGalleryItem: GalleryInput = {
    title: '',
    caption: '',
    tour_id: '',
    is_featured: false,
    is_active: true,
    display_order: 0,
};

/** An existing photograph, in the shape the form edits. */
export function toInput(item: GalleryItem): GalleryInput {
    return {
        title: item.title,
        caption: item.caption ?? '',
        tour_id: item.tour_id === null ? '' : String(item.tour_id),
        is_featured: item.is_featured,
        is_active: item.is_active,
        display_order: item.display_order,
    };
}
