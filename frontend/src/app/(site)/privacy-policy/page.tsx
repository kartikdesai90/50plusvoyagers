import type { Metadata } from 'next';

import PrivacyPolicyPage from '@/site/pages/privacy-policy';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Privacy policy — ${siteConfig.name}`,
        description:
            'What we ask you for, why we need it, who ever sees it, and how to make us stop.',
        path: '/privacy-policy',
    });
}

export default function Page() {
    return <PrivacyPolicyPage />;
}
