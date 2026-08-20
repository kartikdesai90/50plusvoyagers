import type { Metadata } from 'next';

import GroupToursPage from '@/site/pages/group-tours';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Group tours for travellers over 50 — ${siteConfig.name}`,
        description:
            'Small-group, fully hosted departures across India and the world, designed for travellers aged fifty and over. Twelve to sixteen guests, an unhurried pace, and a tour manager on every trip.',
        path: '/group-tours',
    });
}

export default function Page() {
    return <GroupToursPage />;
}
