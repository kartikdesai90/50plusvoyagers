import type { HeroBannerInput } from '@/admin/features/hero-banners/types';

/**
 * What the form starts as when a band is being added.
 *
 * A hero picture, active, first in the order — the band an editor is most
 * likely to be adding, so the common case needs the fewest decisions.
 */
export const blankBand: HeroBannerInput = {
    section_type: 'hero',
    label: '',
    heading: '',
    description: '',
    button_text: '',
    button_url: '',
    caption_label: '',
    caption_heading: '',
    caption_text: '',
    caption_button_text: '',
    caption_button_url: '',
    is_active: true,
    display_order: 0,
};
