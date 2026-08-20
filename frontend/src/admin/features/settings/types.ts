/**
 * The site's settings, as the admin works with them.
 *
 * Mirrors `App\Http\Resources\Admin\SiteSettingResource`. The derived links —
 * what the WhatsApp number resolves to, what the telephone number dials — come
 * from the server so the screen can show an editor what their value became
 * without rebuilding the rule here and getting a different answer.
 */

/** A label and an address, added a row at a time. */
export type LinkPair = {
    label: string;
    url: string;
};

export type SiteSettings = {
    company_name: string;
    email: string | null;
    phone: string | null;
    phone_alt: string | null;
    whatsapp_number: string | null;
    address: string | null;
    map_url: string | null;

    facebook_url: string | null;
    instagram_url: string | null;
    youtube_url: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    other_socials: LinkPair[];

    logo_url: string | null;
    logo_alt: string | null;
    favicon_url: string | null;
    website_url: string | null;

    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_image_url: string | null;

    copyright_text: string | null;
    footer_description: string | null;
    footer_links: LinkPair[];

    /** What the server made of the numbers, so the screen can show it back. */
    whatsapp_href: string | null;
    phone_href: string | null;
    email_href: string | null;

    /** Null until the settings have been saved for the first time. */
    updated_at: string | null;
};

/**
 * What the form holds.
 *
 * Every text value is a string rather than `string | null`: a form field's
 * empty state is an empty string, and letting null in would mean every input
 * needing a `?? ''` at the point it is read. The server turns the empty ones
 * back into nulls on the way in.
 *
 * The three pictures travel separately — they are not text.
 */
export type SettingsInput = {
    company_name: string;
    email: string;
    phone: string;
    phone_alt: string;
    whatsapp_number: string;
    address: string;
    map_url: string;

    facebook_url: string;
    instagram_url: string;
    youtube_url: string;
    linkedin_url: string;
    twitter_url: string;
    other_socials: LinkPair[];

    logo_alt: string;
    website_url: string;

    meta_title: string;
    meta_description: string;
    meta_keywords: string;

    copyright_text: string;
    footer_description: string;
    footer_links: LinkPair[];
};

/** The pictures the settings hold, each replaced on its own. */
export type SettingsFiles = {
    logo_file: File | null;
    favicon_file: File | null;
    og_image_file: File | null;
};
