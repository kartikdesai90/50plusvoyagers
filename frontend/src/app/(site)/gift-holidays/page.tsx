import type { Metadata } from 'next';

import GiftHolidaysPage from '@/site/pages/gift-holidays';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Gift a holiday to your parents — ${siteConfig.name}`,
        description:
            'Private, custom-planned holidays for senior citizens: leisurely paced, senior-friendly hotels and transport, special care and diet, and a host on call throughout.',
        path: '/gift-holidays',
    });
}

export default function Page() {
    return <GiftHolidaysPage />;
}
