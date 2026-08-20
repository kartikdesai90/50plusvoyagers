'use client';

import { LegalPage } from '@/site/components/legal-page';
import { termsSections, termsUpdated } from '@/site/data/legal';

export default function TermsAndConditionsPage() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Terms & conditions"
            lead="How booking works, what the price covers, and what happens if either of us has to cancel."
            updated={termsUpdated}
            sections={termsSections}
        />
    );
}
