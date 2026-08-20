import type { ReactNode } from 'react';

import { Container, Eyebrow, Section } from '@/site/components/section';
import { emphasised } from '@/site/components/emphasis';
import { cn } from '@/shared/lib/utils';

type PageHeroProps = {
    eyebrow: string;
    title: ReactNode;
    lead?: ReactNode;
    /** Optional photograph beneath the copy, in the homepage hero's frame. */
    image?: { src: string; alt: string };
    /** Statistics or facts rendered as a rule-separated row under the lead. */
    facts?: { label: string; value: string }[];
    children?: ReactNode;
};

/**
 * The top of every page that is not the homepage.
 *
 * It is deliberately the homepage hero with the slider taken out: same centred
 * measure, same eyebrow, same serif display face, same rounded media frame.
 * Inner pages therefore read as the same site rather than as a second design
 * that happens to share a header.
 */
export function PageHero({ eyebrow, title, lead, image, facts, children }: PageHeroProps) {
    return (
        <Section top="sm" bottom={image || facts ? 'none' : 'sm'}>
            <Container>
                <div className="mx-auto max-w-[760px] text-center">
                    <Eyebrow className="mb-[22px] tracking-[0.26em]">{eyebrow}</Eyebrow>
                    {/* Marked the same way the homepage hero is: one word or
                        phrase in asterisks takes the brand italic. */}
                    <h1 className="voy-heading mx-auto text-[clamp(34px,5.2vw,64px)] [line-height:1.02] tracking-[-0.025em]">
                        {emphasised(title)}
                    </h1>
                    {lead ? (
                        <p className="mx-auto mt-6 max-w-[600px] text-[clamp(16px,1.4vw,19px)]/[1.6] text-ink-muted">
                            {lead}
                        </p>
                    ) : null}
                    {children ? (
                        <div className="mt-[30px] flex flex-wrap items-center justify-center gap-x-[26px] gap-y-4">
                            {children}
                        </div>
                    ) : null}
                </div>

                {facts ? (
                    <ul
                        data-voy-group
                        className={cn(
                            'mx-auto mt-[clamp(40px,5vw,60px)] grid max-w-[900px] gap-y-8',
                            'grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))]',
                            'divide-hairline sm:divide-x',
                        )}
                    >
                        {facts.map((fact) => (
                            <li key={fact.label} className="px-4 text-center">
                                <div className="font-serif text-[clamp(28px,3vw,38px)]/none font-normal text-ink">
                                    {fact.value}
                                </div>
                                <div className="mt-2.5 text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                    {fact.label}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {image ? (
                    <div className="voy-hero-media mt-[clamp(40px,5vw,64px)]">
                        <img
                            src={image.src}
                            alt={image.alt}
                            className="size-full object-cover"
                            fetchPriority="high"
                        />
                    </div>
                ) : null}
            </Container>
        </Section>
    );
}
