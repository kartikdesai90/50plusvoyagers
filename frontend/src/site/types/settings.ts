/**
 * What is true on every page, as the server sends it.
 *
 * Mirrors `App\Http\Resources\Site\SiteSettingResource`. Two things arrive
 * ready to use rather than raw: the social accounts as one already-ordered,
 * already-labelled list, and the telephone numbers with their links already
 * built. The markup should never be in the business of turning
 * `+91 74065 77905` into something a browser can dial.
 *
 * Every field can be null. A business without a LinkedIn account, a second
 * telephone line or a logo is an ordinary business — `@/site/data/settings` is
 * where each missing one falls back to what the design ships with.
 */

/** A network the design draws a mark for, plus `link` for anything else. */
export type SocialPlatform =
    'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'twitter' | 'whatsapp' | 'link';

export type SocialLink = {
    platform: SocialPlatform;
    label: string;
    url: string;
};

export type FooterLink = {
    label: string;
    url: string;
};

export type SiteSettings = {
    company_name: string;

    email: string | null;
    email_href: string | null;
    phone: string | null;
    phone_href: string | null;
    phone_alt: string | null;
    phone_alt_href: string | null;
    whatsapp_href: string | null;
    address: string | null;
    map_url: string | null;

    /** Only the profiles with an address. Already in the order to draw them. */
    socials: SocialLink[];

    logo_url: string | null;
    logo_alt: string;
    favicon_url: string | null;
    website_url: string | null;

    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_image_url: string | null;

    /** Without the year — whoever renders it knows what year it is. */
    copyright_text: string;
    footer_description: string | null;
    footer_links: FooterLink[];
};
