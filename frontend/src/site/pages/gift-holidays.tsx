'use client';

import { ArrowRight, Check } from 'lucide-react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { EnquiryForm } from '@/site/components/enquiry-form';
import { PageHero } from '@/site/components/page-hero';
import { Button } from '@/shared/ui/button';
import { giftPackages, giftPromises, giftSteps } from '@/site/data/gift-holidays';
import { paths } from '@/routes/paths';
import { siteConfig } from '@/site/config/site';

/**
 * Gift Holidays.
 *
 * The one page on the site written for somebody other than the traveller — it
 * is usually an adult child reading it, planning a trip for a parent. The copy
 * addresses them directly, and the page ends on an enquiry form rather than on
 * a booking button, because a private trip starts with a conversation.
 */
export default function GiftHolidaysPage() {
    return (
        <>
            <PageHero
                eyebrow="Gift holidays"
                title="Gift them a *dream destination*."
                lead="A private, custom-planned holiday for your parents — leisurely paced, senior-friendly throughout, and hosted end to end. You choose the destination; we take care of everything else."
                image={{
                    src: '/images/home/why-travellers-together.webp',
                    alt: 'Travellers together on a 50+ Voyagers holiday',
                }}
            >
                <Button asChild variant="brand" size="pill">
                    <a href="#plan">
                        Plan a gift holiday
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                </Button>
                <a
                    href={siteConfig.enquiryPhoneHref}
                    className="inline-flex items-center gap-[9px] text-sm font-bold tracking-[0.02em] text-ink transition-colors hover:text-brand"
                >
                    Call {siteConfig.enquiryPhone}
                </a>
            </PageHero>

            <Section>
                <Container>
                    <div className="max-w-[680px]">
                        <Eyebrow className="mb-5">Why it is different</Eyebrow>
                        <SectionHeading>
                            A holiday planned around what they can *actually enjoy*.
                        </SectionHeading>
                    </div>

                    <div
                        data-voy-group
                        className="mt-[clamp(40px,5vw,64px)] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(28px,3vw,44px)]"
                    >
                        {giftPromises.map((promise) => (
                            <div key={promise.title} className="border-t-2 border-brand pt-[22px]">
                                <h3 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                    {promise.title}
                                </h3>
                                <p className="text-[15px]/[1.58] text-ink-muted">{promise.body}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section tone="alt">
                <Container>
                    <div className="mx-auto mb-[clamp(40px,5vw,60px)] max-w-[640px] text-center">
                        <Eyebrow className="mb-[18px]">Popular gift holidays</Eyebrow>
                        <SectionHeading className="text-balance">
                            *Starting points*, not fixed packages
                        </SectionHeading>
                        <p className="mx-auto mt-5 max-w-[520px] text-[16px]/[1.6] text-ink-muted">
                            Every one of these is reworked around the people travelling. Treat the
                            prices as a guide for two people sharing a room.
                        </p>
                    </div>

                    <div
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-[clamp(18px,2vw,28px)]"
                    >
                        {giftPackages.map((item) => (
                            <article
                                key={item.slug}
                                data-voy-card
                                className="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface"
                            >
                                <div className="overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        loading="lazy"
                                        data-voy-img
                                        className="h-[220px] w-full object-cover"
                                    />
                                </div>

                                <div className="flex flex-1 flex-col p-[26px]">
                                    <p className="mb-3 text-[11.5px] font-bold tracking-[0.16em] text-brand uppercase">
                                        {item.duration}
                                    </p>
                                    <h3 className="mb-3 font-serif text-[22px]/[1.2] font-medium tracking-[-0.01em] text-ink">
                                        {item.title}
                                    </h3>
                                    <p className="mb-4 text-[15px]/[1.55] text-ink-muted">
                                        {item.summary}
                                    </p>
                                    <p className="mb-6 text-[13px] text-ink-muted">
                                        {item.places.join(' · ')}
                                    </p>

                                    <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-hairline pt-5">
                                        <span className="text-[15px] font-bold text-brand">
                                            {item.price}
                                        </span>
                                        <a
                                            href="#plan"
                                            className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.04em] text-ink transition-colors hover:text-brand"
                                        >
                                            Plan this
                                            <ArrowRight
                                                className="size-[15px]"
                                                aria-hidden="true"
                                            />
                                        </a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section>
                <Container>
                    <div className="grid items-center gap-[clamp(36px,5vw,72px)] lg:grid-cols-2">
                        <div>
                            <Eyebrow className="mb-5">How it works</Eyebrow>
                            <h2 className="voy-heading mb-8 text-[clamp(28px,3.4vw,44px)]/[1.08]">
                                Four steps, and one of them is theirs.
                            </h2>

                            <ol className="flex flex-col">
                                {giftSteps.map((step, i) => (
                                    <li
                                        key={step.title}
                                        className="flex gap-5 border-b border-hairline py-[22px] first:pt-0 last:border-b-0 last:pb-0"
                                    >
                                        <span className="font-serif text-[22px] text-ink-muted opacity-55">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span>
                                            <span className="mb-2 block text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                                {step.title}
                                            </span>
                                            <span className="block text-[15.5px]/[1.6] text-ink-muted">
                                                {step.body}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <div className="group relative overflow-hidden rounded-xl">
                            <img
                                src="/images/home/value-fully-hosted.webp"
                                alt="A 50+ Voyagers host with guests on a private holiday"
                                loading="lazy"
                                className="h-[clamp(360px,42vw,520px)] w-full object-cover"
                            />
                            <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.82)] via-[rgb(16_15_12/0.2)] via-55% to-transparent to-82% p-7">
                                <div className="font-serif text-[26px]/[1.1] font-normal">
                                    Eight to twelve guests
                                </div>
                                <div className="mt-2 text-[15px] text-white/85">
                                    Small enough to travel like a family, which is rather the point.
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </Section>

            <Section id="plan" tone="alt">
                <Container className="max-w-[880px]">
                    <div className="mb-[clamp(32px,4vw,44px)] text-center">
                        <Eyebrow className="mb-[18px]">Plan a gift holiday</Eyebrow>
                        <SectionHeading size="h3" className="text-balance">
                            Tell us about *them*
                        </SectionHeading>
                        <p className="mx-auto mt-5 max-w-[520px] text-[16px]/[1.6] text-ink-muted">
                            Where they have always wanted to go, how they travel, and anything we
                            should plan around. We will come back with an itinerary within two
                            working days.
                        </p>
                    </div>

                    <EnquiryForm
                        id="gift"
                        subject="a gift holiday for my parents"
                        submitLabel="Request an itinerary"
                    />

                    <ul className="mt-9 flex flex-wrap justify-center gap-x-8 gap-y-3">
                        {[
                            'No obligation',
                            'Itinerary in 2 working days',
                            'Instalment payments',
                        ].map((item) => (
                            <li
                                key={item}
                                className="flex items-center gap-2 text-[14.5px] text-ink-muted"
                            >
                                <Check
                                    className="size-[17px] text-brand"
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                />
                                {item}
                            </li>
                        ))}
                    </ul>
                </Container>
            </Section>

            <CtaBand
                heading="Would they rather join a *group*?"
                body="Many parents prefer the company of a small group to a private trip. Our departures are built for exactly that."
                action={{ label: 'See group tours', href: paths.groupTours }}
                tone="surface"
            />
        </>
    );
}
