import type { Metadata } from 'next';

import MembershipPage from '@/site/pages/membership';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Membership — India's travel community for over 50s — ${siteConfig.name}`,
        description:
            'Join 25,000+ members aged fifty and over. Early access to departures, member pricing, loyalty points, instalment payments and the WhatsApp community. Free to join.',
        path: '/membership',
    });
}

export default function Page() {
    return <MembershipPage />;
}
