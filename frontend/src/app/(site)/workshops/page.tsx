import type { Metadata } from 'next';

import WorkshopsPage from '@/site/pages/workshops';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Day-outs & workshops for seniors in Bengaluru — ${siteConfig.name}`,
        description:
            'Silver Space: creative, fitness and hobby workshops for people over fifty in Bengaluru. Zumba, yoga, tai chi, folk-art painting, photography walks and monthly day-outs.',
        path: '/workshops',
    });
}

export default function Page() {
    return <WorkshopsPage />;
}
