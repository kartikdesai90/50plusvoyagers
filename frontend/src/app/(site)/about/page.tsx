import type { Metadata } from 'next';

import AboutPage from '@/site/pages/about';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `About us — a travel club for the over 50s — ${siteConfig.name}`,
        description:
            'Why 50+ Voyagers exists: small groups of twelve to sixteen, everybody fifty or over, an unhurried pace, and a tour manager whose job is to make sure nobody feels like the odd one out.',
        path: '/about',
    });
}

export default function Page() {
    return <AboutPage />;
}
