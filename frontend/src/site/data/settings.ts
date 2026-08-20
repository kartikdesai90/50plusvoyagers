import { siteConfig } from '@/site/config/site';
import type { SiteSettings } from '@/site/types/settings';

/**
 * The settings as the design ships them, for a site nobody has configured yet.
 *
 * Not a second copy of the content: this is built from the same constants the
 * header and footer have always read, and the seeder writes the same values
 * into the database. What it buys is a site that still has a telephone number
 * in its footer on a fresh install, before anyone has signed in to the admin.
 *
 * The social accounts are deliberately empty. The footer has been pointing its
 * Instagram and Facebook marks at the homepage because the real handles were
 * never confirmed, and a guessed handle sends people to somebody else's page —
 * worse than a mark that is not drawn. They appear the day someone types them
 * into the settings screen.
 */
export const fallbackSettings: SiteSettings = {
    company_name: siteConfig.name,

    email: siteConfig.email,
    email_href: siteConfig.emailHref,
    phone: siteConfig.enquiryPhone,
    phone_href: siteConfig.enquiryPhoneHref,
    phone_alt: siteConfig.phone,
    phone_alt_href: siteConfig.phoneHref,
    whatsapp_href: siteConfig.whatsappHref,
    address: siteConfig.address,
    map_url: null,

    socials: [],

    logo_url: null,
    logo_alt: '',
    favicon_url: null,
    website_url: null,

    meta_title: siteConfig.name,
    meta_description: siteConfig.description,
    meta_keywords: null,
    og_image_url: null,

    copyright_text: `${siteConfig.name}. Made for the explorer at heart.`,
    footer_description: null,
    footer_links: [],
};

/**
 * The stored settings, with anything an editor left empty filled in from the
 * design.
 *
 * Field by field rather than all-or-nothing. A site that has been configured
 * with a new telephone number and nothing else should show the new number and
 * the shipped address, not the new number and a gap — and an all-or-nothing
 * fallback would give it the gap the moment the row existed.
 */
export function withFallbacks(stored: SiteSettings | null): SiteSettings {
    if (!stored) return fallbackSettings;

    const configured = Object.entries(stored).filter(([, value]) => {
        if (value === null || value === '') return false;
        /* An empty list is "nothing configured", not "configured empty". */
        if (Array.isArray(value) && value.length === 0) return false;

        return true;
    });

    return { ...fallbackSettings, ...Object.fromEntries(configured) };
}
