import type { Metadata } from 'next';

import ContactPage from '@/site/pages/contact';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Contact us — ${siteConfig.name}`,
        description:
            'Call, email or WhatsApp the 50+ Voyagers team in Bengaluru. Tour enquiries, membership questions and workshop bookings — answered by a person, within a working day.',
        path: '/contact',
    });
}

export default function Page() {
    return <ContactPage />;
}
