'use client';

import { Star } from 'lucide-react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { PageHero } from '@/site/components/page-hero';
import { aboutFacts, aboutStory, aboutValues, pressMentions } from '@/site/data/about';
import { hostingSteps } from '@/site/data/home';
import { paths } from '@/routes/paths';

/**
 * About us.
 *
 * Built from the homepage's own sections in a different order — the values
 * grid, the press strip, the hosting steps — with the founding story as the one
 * genuinely new block. That is deliberate: an about page that introduced its own
 * layout vocabulary would read as a different site, and the story is stronger
 * told in the components the visitor has already learned to read.
 */
export default function AboutPage() {
    return (
        <>
            <PageHero
                eyebrow="About us"
                title="Connecting people. Living adventure. *Celebrating life*."
                lead="A travel and adventure club for people over fifty, built because every tour on the market was designed for somebody thirty years younger."
                facts={aboutFacts}
                image={{
                    src: '/images/home/why-travellers-together.webp',
                    alt: 'A 50+ Voyagers group together on a departure',
                }}
            />

            <Section>
                <Container>
                    <div className="grid gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
                        <div>
                            <Eyebrow className="mb-5">Our story</Eyebrow>
                            <h2 className="voy-heading text-[clamp(26px,3vw,38px)]/[1.08]">
                                It started as a complaint.
                            </h2>
                        </div>

                        <div className="flex flex-col gap-5">
                            {aboutStory.map((paragraph, i) => (
                                <p
                                    key={i}
                                    className="max-w-[68ch] text-[clamp(16px,1.35vw,17.5px)]/[1.7] text-ink-muted"
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </div>
                </Container>
            </Section>

            <Section tone="alt">
                <Container>
                    <div className="max-w-[680px]">
                        <Eyebrow className="mb-5">What we hold to</Eyebrow>
                        <SectionHeading>
                            Four things we will *not* trade away for a cheaper trip.
                        </SectionHeading>
                    </div>

                    <div
                        data-voy-group
                        className="mt-[clamp(40px,5vw,64px)] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(22px,3vw,36px)]"
                    >
                        {aboutValues.map((value) => (
                            <div key={value.title} data-voy-card>
                                <div className="overflow-hidden rounded-lg">
                                    <img
                                        src={value.src}
                                        alt={value.title}
                                        loading="lazy"
                                        data-voy-img
                                        className="h-[190px] w-full object-cover"
                                    />
                                </div>
                                <div className="mt-[18px] mb-2 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                    {value.title}
                                </div>
                                <p className="text-[15px]/[1.55] text-ink-muted">{value.body}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section>
                <Container>
                    <div className="mx-auto mb-[clamp(44px,5vw,64px)] max-w-[640px] text-center">
                        <Eyebrow className="mb-[18px]">On every departure</Eyebrow>
                        <SectionHeading size="h3">
                            What &quot;fully hosted&quot; *really* means
                        </SectionHeading>
                    </div>

                    <ol
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[clamp(28px,3vw,44px)]"
                    >
                        {hostingSteps.map((step, i) => (
                            <li key={step.title} className="border-t-2 border-brand pt-[22px]">
                                <div className="mb-3.5 font-serif text-2xl font-normal text-ink-muted opacity-60">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <h3 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                    {step.title}
                                </h3>
                                <p className="text-[15px]/[1.58] text-ink-muted">{step.body}</p>
                            </li>
                        ))}
                    </ol>
                </Container>
            </Section>

            <Section tone="alt" top="sm" bottom="sm">
                <Container className="text-center">
                    <p className="text-[12px]/none font-bold tracking-[0.22em] text-ink-muted uppercase">
                        As featured in
                    </p>
                    <div className="mb-9 font-serif text-[clamp(20px,2.2vw,26px)] font-normal text-ink italic">
                        Written about by the papers our members actually read
                    </div>

                    <ul
                        data-voy-group
                        className="flex flex-wrap items-center justify-center gap-[clamp(24px,4vw,56px)] text-ink opacity-55"
                    >
                        {pressMentions.map((name) => (
                            <li key={name} className="font-serif text-[19px] font-semibold">
                                {name}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-3 border-t border-hairline pt-7">
                        <span className="flex gap-[3px]" aria-hidden="true">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className="size-[18px] fill-brand text-brand" />
                            ))}
                        </span>
                        <span className="text-[15px] font-bold text-ink">4.8 / 5</span>
                        <span className="text-sm text-ink-muted">
                            Rated Excellent by 2,400+ voyagers
                        </span>
                    </div>
                </Container>
            </Section>

            <CtaBand
                heading="Come and see for *yourself*."
                body="Join the club — it is free — or come to a day-out first and decide afterwards. Nobody here will chase you."
                action={{ label: 'Become a member', href: paths.membership }}
                tone="surface"
            />
        </>
    );
}
