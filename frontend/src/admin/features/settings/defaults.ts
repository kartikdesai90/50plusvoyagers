import type { SettingsFiles, SettingsInput, SiteSettings } from '@/admin/features/settings/types';

/** Nothing chosen yet. */
export const noFiles: SettingsFiles = {
    logo_file: null,
    favicon_file: null,
    og_image_file: null,
};

/**
 * An empty settings form, for a site nobody has configured yet.
 *
 * Reached on a fresh install, where the server hands back a record with nothing
 * on it rather than nothing at all — so the screen is the same screen either
 * way, and the editor is filling in blanks rather than meeting an error.
 */
export const blankSettings: SettingsInput = {
    company_name: '',
    email: '',
    phone: '',
    phone_alt: '',
    whatsapp_number: '',
    address: '',
    map_url: '',

    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    linkedin_url: '',
    twitter_url: '',
    other_socials: [],

    logo_alt: '',
    website_url: '',

    meta_title: '',
    meta_description: '',
    meta_keywords: '',

    copyright_text: '',
    footer_description: '',
    footer_links: [],
};

/** The stored settings, in the shape the form edits. */
export function toInput(settings: SiteSettings): SettingsInput {
    return {
        company_name: settings.company_name ?? '',
        email: settings.email ?? '',
        phone: settings.phone ?? '',
        phone_alt: settings.phone_alt ?? '',
        whatsapp_number: settings.whatsapp_number ?? '',
        address: settings.address ?? '',
        map_url: settings.map_url ?? '',

        facebook_url: settings.facebook_url ?? '',
        instagram_url: settings.instagram_url ?? '',
        youtube_url: settings.youtube_url ?? '',
        linkedin_url: settings.linkedin_url ?? '',
        twitter_url: settings.twitter_url ?? '',
        other_socials: settings.other_socials,

        logo_alt: settings.logo_alt ?? '',
        website_url: settings.website_url ?? '',

        meta_title: settings.meta_title ?? '',
        meta_description: settings.meta_description ?? '',
        meta_keywords: settings.meta_keywords ?? '',

        copyright_text: settings.copyright_text ?? '',
        footer_description: settings.footer_description ?? '',
        footer_links: settings.footer_links,
    };
}
