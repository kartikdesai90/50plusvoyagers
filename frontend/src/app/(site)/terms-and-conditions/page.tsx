import type { Metadata } from 'next';

import TermsAndConditionsPage from '@/site/pages/terms-and-conditions';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Terms & conditions — ${siteConfig.name}`,
        description:
            'How booking works, what the price covers, and what happens if either of us has to cancel.',
        path: '/terms-and-conditions',
    });
}

export default function Page() {
    return <TermsAndConditionsPage />;
}
