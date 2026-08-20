'use client';

import { CtaBand } from '@/site/components/cta-band';
import { Container, Section } from '@/site/components/section';
import { PageHero } from '@/site/components/page-hero';

export type LegalSection = {
    heading: string;
    /** Rendered as paragraphs; a nested array becomes a bulleted list. */
    body: (string | string[])[];
};

type LegalPageProps = {
    eyebrow: string;
    title: string;
    lead: string;
    updated: string;
    sections: LegalSection[];
};

/**
 * Privacy and terms share one page component.
 *
 * They are the same document in two flavours — a narrow single-column measure
 * of headed prose — and giving them one component means the reading measure,
 * the heading scale and the numbering can only ever be set once.
 */
export function LegalPage({ eyebrow, title, lead, updated, sections }: LegalPageProps) {
    return (
        <>
            <PageHero
                eyebrow={eyebrow}
                title={title}
                lead={lead}
            />

            <Section top="sm">
                <Container className="max-w-[820px]">
                    <p className="mb-[clamp(36px,4vw,52px)] border-b border-hairline pb-6 text-[13px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                        Last updated {updated}
                    </p>

                    <div className="flex flex-col gap-[clamp(36px,4vw,52px)]">
                        {sections.map((section, i) => (
                            <section key={section.heading}>
                                <h2 className="voy-heading mb-4 flex gap-3.5 text-[clamp(22px,2.4vw,30px)]">
                                    <span className="text-ink-muted opacity-50">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {section.heading}
                                </h2>

                                <div className="flex flex-col gap-4">
                                    {section.body.map((block, j) =>
                                        Array.isArray(block) ? (
                                            <ul
                                                key={j}
                                                className="flex list-disc flex-col gap-2 pl-5 text-[16px]/[1.7] text-ink-muted marker:text-brand"
                                            >
                                                {block.map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p key={j} className="text-[16px]/[1.7] text-ink-muted">
                                                {block}
                                            </p>
                                        ),
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                </Container>
            </Section>

            <CtaBand
                heading="Questions about *any of this*?"
                body="Write to us and a person — not a form queue — will answer."
            />
        </>
    );
}
