/**
 * A homepage band, as the admin works with it.
 *
 * Mirrors `App\Http\Resources\Admin\HeroBannerResource`. The labels arrive
 * already written for a person — the screen renders them rather than keeping
 * its own copy, so the words an editor reads are decided in one place.
 */

export type SectionType = 'hero' | 'banner';

export type HeroBanner = {
    id: number;
    section_type: SectionType;
    section_label: string;
    media_url: string;
    label: string | null;
    heading: string;
    description: string | null;
    button_text: string | null;
    button_url: string | null;
    /* The words printed over a hero photograph. Hero bands only. */
    caption_label: string | null;
    caption_heading: string | null;
    caption_text: string | null;
    caption_button_text: string | null;
    caption_button_url: string | null;
    is_active: boolean;
    display_order: number;
    created_at: string | null;
    updated_at: string | null;
};

export type HeroBannerChoices = {
    sections: { value: SectionType; label: string; description: string }[];
};

export type HeroBannerListResponse = {
    data: HeroBanner[];
    meta: HeroBannerChoices;
};

/** What the form holds. The file is carried separately — it is not text. */
export type HeroBannerInput = {
    section_type: SectionType;
    label: string;
    heading: string;
    description: string;
    button_text: string;
    button_url: string;
    caption_label: string;
    caption_heading: string;
    caption_text: string;
    caption_button_text: string;
    caption_button_url: string;
    is_active: boolean;
    display_order: number;
};
