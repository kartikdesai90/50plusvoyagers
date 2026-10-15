import { paths } from '@/routes/paths';

/**
 * One source of truth for what the business is called, how to reach it, and
 * where every piece of chrome points.
 *
 * Header and footer both read from here, which is what stops the two from
 * drifting apart. Entries are plain `{ label, href }` pairs; the `NavLink`
 * component decides between a client-side navigation and a plain anchor by
 * looking at the href, so nothing in this file has to know about the transport.
 */
export const siteConfig = {
    name: process.env.NEXT_PUBLIC_APP_NAME || '50+ Voyagers',
    description: 'Travel experiences designed for voyagers over fifty.',
    phone: '+91 74065 77905',
    phoneHref: 'tel:+917406577905',
    phoneAlt: '+91 80957 67595',
    phoneAltHref: 'tel:+918095767595',
    enquiryPhone: '+91 80957 73222',
    enquiryPhoneHref: 'tel:+918095773222',
    email: 'info@50plusvoyagers.com',
    emailHref: 'mailto:info@50plusvoyagers.com',
    whatsappHref: 'https://wa.me/918095773222',
    address: 'HSR Layout, Bengaluru, Karnataka, India',

    /* Split either side of the wordmark on desktop; concatenated on mobile. */
    navLeft: [
        { label: 'Upcoming Group Tours', href: paths.groupTours },
        { label: 'Membership', href: paths.membership },
    ],
    navRight: [
        { label: 'Blogs', href: paths.blog },
        { label: 'About Us', href: paths.about },
    ],

    footerNav: [
        {
            title: 'Travel with us',
            links: [
                { label: 'Group tours', href: paths.groupTours },
                { label: 'Upcoming departures', href: paths.homeSections.trips },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'About us', href: paths.about },
                { label: 'Membership', href: paths.membership },
                { label: 'Traveller stories', href: paths.homeSections.stories },
                { label: 'The gallery', href: paths.gallery },
                { label: 'Blogs', href: paths.blog },
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Contact us', href: paths.contact },
                { label: 'How it works', href: paths.homeSections.why },
                { label: 'Booking & payments', href: `${paths.contact}#faqs` },
                { label: 'FAQs', href: `${paths.contact}#faqs` },
            ],
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy policy', href: paths.privacy },
                { label: 'Terms & conditions', href: paths.terms },
            ],
        },
    ],
} as const;

export type SiteConfig = typeof siteConfig;
