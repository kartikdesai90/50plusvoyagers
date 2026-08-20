'use client';

import { LegalPage } from '@/site/components/legal-page';
import { privacySections, privacyUpdated } from '@/site/data/legal';

export default function PrivacyPolicyPage() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Privacy policy"
            lead="What we ask you for, why we need it, who ever sees it, and how to make us stop."
            updated={privacyUpdated}
            sections={privacySections}
        />
    );
}
