'use client';

import { ArrowRight, Check } from 'lucide-react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { EnquiryForm } from '@/site/components/enquiry-form';
import { FaqList } from '@/site/components/faq-list';
import { PageHero } from '@/site/components/page-hero';
import { Button } from '@/shared/ui/button';
import { aboutFacts, faqs, membershipBenefits, membershipSteps } from '@/site/data/about';
import { toasts } from '@/site/data/home';
import { paths } from '@/routes/paths';

/**
 * Membership.
 *
 * Free to join, and the page says so early and repeatedly, because the single
 * biggest reason people hesitate on a page like this is a suspicion that a
 * price is about to appear. The registration form sits mid-page rather than at
 * the bottom — the benefits above it are the argument, and everything below it
 * is for the people who need more of one.
 */
export default function MembershipPage() {
    return (
        <>
            <PageHero
                eyebrow="Membership"
                title="Life begins at *50*."
                lead="India's largest travel community for people over fifty. Make friends, see ninety countries' worth of the world, and celebrate the part of life you actually have time for. Joining is free."
                facts={aboutFacts}
            >
                <Button asChild variant="brand" size="pill">
                    <a href="#register">
                        Register free
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                </Button>
                <a
                    href="#benefits"
                    className="inline-flex items-center gap-[9px] text-sm font-bold tracking-[0.02em] text-ink transition-colors hover:text-brand"
                >
                    What you get
                </a>
            </PageHero>

            <Section id="benefits">
                <Container>
                    <div className="mx-auto mb-[clamp(40px,5vw,60px)] max-w-[640px] text-center">
                        <Eyebrow className="mb-[18px]">Member benefits</Eyebrow>
                        <SectionHeading className="text-balance">
                            What membership *actually* gets you
                        </SectionHeading>
                    </div>

                    <div
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(20px,2.4vw,28px)]"
                    >
                        {membershipBenefits.map((benefit) => (
                            <div
                                key={benefit.title}
                                className="rounded-2xl border border-hairline bg-surface p-[28px] transition-colors hover:border-brand"
                            >
                                <Check
                                    className="mb-5 size-6 text-brand"
                                    strokeWidth={1.7}
                                    aria-hidden="true"
                                />
                                <h3 className="mb-2.5 text-[17px]/[1.35] font-bold text-ink">
                                    {benefit.title}
                                </h3>
                                <p className="text-[15px]/[1.58] text-ink-muted">{benefit.body}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section tone="alt" bottom="none">
                <Container>
                    <div className="mx-auto mb-[clamp(44px,5vw,64px)] max-w-[640px] text-center">
                        <Eyebrow className="mb-[18px]">Joining</Eyebrow>
                        <SectionHeading size="h3">
                            *Four steps*, none of them onerous
                        </SectionHeading>
                    </div>

                    <ol
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[clamp(28px,3vw,44px)]"
                    >
                        {membershipSteps.map((step, i) => (
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

            <Section id="register" tone="alt">
                <Container className="max-w-[880px]">
                    <div className="mb-[clamp(32px,4vw,44px)] text-center">
                        <Eyebrow className="mb-[18px]">Register</Eyebrow>
                        <SectionHeading size="h3" className="text-balance">
                            Join the *club*
                        </SectionHeading>
                        <p className="mx-auto mt-5 max-w-[520px] text-[16px]/[1.6] text-ink-muted">
                            Open to anyone aged fifty and over. There is no fee, no minimum, and no
                            obligation to book anything at all.
                        </p>
                    </div>

                    <EnquiryForm
                        id="membership"
                        askAge
                        submitLabel="Become a member"
                        subject="joining 50+ Voyagers"
                    />
                </Container>
            </Section>

            <Section>
                <Container>
                    <div
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(272px,1fr))] gap-[clamp(28px,3.4vw,48px)]"
                    >
                        {toasts.map((toast) => (
                            <figure key={toast.name} className="flex flex-col text-center">
                                <blockquote className="font-serif text-[clamp(19px,1.9vw,23px)]/[1.36] font-normal tracking-[-0.01em] text-balance text-ink">
                                    {toast.body}
                                </blockquote>
                                <figcaption className="mt-auto flex items-center justify-center gap-[13px] pt-[26px]">
                                    <img
                                        src={toast.src}
                                        alt={toast.name}
                                        loading="lazy"
                                        className="size-[52px] shrink-0 rounded-full object-cover"
                                    />
                                    <div className="text-left">
                                        <div className="text-[15px] font-bold text-ink">
                                            {toast.name}
                                        </div>
                                        <div className="mt-0.5 text-[13px] text-ink-muted">
                                            {toast.trip}
                                        </div>
                                    </div>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section id="faqs" tone="alt">
                <Container className="max-w-[860px]">
                    <div className="mb-[clamp(32px,4vw,44px)] text-center">
                        <Eyebrow className="mb-[18px]">Before you join</Eyebrow>
                        <SectionHeading size="h3">Questions people *ask us*</SectionHeading>
                    </div>

                    <FaqList items={faqs} />
                </Container>
            </Section>

            <CtaBand
                tone="surface"
                heading="Members see departures *first*."
                body="And the popular ones do fill. Join today, or call us and we will sign you up over the phone."
                action={{ label: 'See upcoming tours', href: paths.groupTours }}
            />
        </>
    );
}
