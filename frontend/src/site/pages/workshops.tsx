'use client';

import { ArrowRight } from 'lucide-react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { EnquiryForm } from '@/site/components/enquiry-form';
import { PageHero } from '@/site/components/page-hero';
import { Button } from '@/shared/ui/button';
import { dayOuts, workshopStrands } from '@/site/data/workshops';
import { paths } from '@/routes/paths';

/**
 * Silver Space — day-outs and workshops.
 *
 * Three strands, each given the homepage's alternating band treatment: copy and
 * photograph side by side, with the strand's classes listed beneath as a plain
 * table-like stack. The image side flips on every other strand, which is the
 * only rhythm the page needs and is achieved with an order utility rather than
 * a second layout.
 */
export default function WorkshopsPage() {
    return (
        <>
            <PageHero
                eyebrow="Silver Space"
                title="It is never *too late* to get fit, or to learn something new."
                lead="Between departures, the club meets closer to home. Fitness classes, folk-art workshops and day-outs around Bengaluru — all pitched for people over fifty, all in small batches."
                image={{
                    src: '/images/home/value-kindred-company.webp',
                    alt: 'Members of the 50+ Voyagers community at a Silver Space workshop',
                }}
            >
                <Button asChild variant="brand" size="pill">
                    <a href="#request">
                        Request the schedule
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </a>
                </Button>
            </PageHero>

            {workshopStrands.map((strand, index) => (
                <Section
                    key={strand.slug}
                    id={strand.slug}
                    tone={index % 2 === 1 ? 'alt' : 'surface'}
                >
                    <Container>
                        <div className="grid items-center gap-[clamp(36px,5vw,72px)] lg:grid-cols-2">
                            <div className={index % 2 === 1 ? 'lg:order-2' : undefined}>
                                <Eyebrow className="mb-5">{strand.name}</Eyebrow>
                                <h2 className="voy-heading mb-[22px] text-[clamp(28px,3.4vw,44px)]/[1.08]">
                                    {strand.tagline}
                                </h2>
                                <p className="text-[17px]/[1.62] text-ink-muted">{strand.body}</p>
                            </div>

                            <div
                                className={`group relative overflow-hidden rounded-xl ${
                                    index % 2 === 1 ? 'lg:order-1' : ''
                                }`}
                            >
                                <img
                                    src={strand.image}
                                    alt={strand.name}
                                    loading="lazy"
                                    className="h-[clamp(300px,34vw,420px)] w-full object-cover"
                                />
                            </div>
                        </div>

                        <ul
                            data-voy-group
                            className="mt-[clamp(36px,4vw,52px)] divide-y divide-hairline border-y border-hairline"
                        >
                            {strand.workshops.map((workshop) => (
                                <li
                                    key={workshop.title}
                                    className="flex flex-wrap items-baseline gap-x-8 gap-y-2.5 py-[22px]"
                                >
                                    <div className="min-w-[220px] flex-1">
                                        <h3 className="text-[17px]/[1.35] font-bold text-ink">
                                            {workshop.title}
                                        </h3>
                                        <p className="mt-2 max-w-[60ch] text-[15px]/[1.55] text-ink-muted">
                                            {workshop.body}
                                        </p>
                                    </div>
                                    <div className="text-[13px] font-bold tracking-[0.06em] whitespace-nowrap text-ink-muted">
                                        {workshop.format}
                                    </div>
                                    <div className="min-w-[90px] text-right text-[15px] font-bold text-brand">
                                        {workshop.price}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Container>
                </Section>
            ))}

            <Section tone="alt">
                <Container>
                    <div className="mx-auto mb-[clamp(36px,4vw,52px)] max-w-[640px] text-center">
                        <Eyebrow className="mb-[18px]">Day-outs</Eyebrow>
                        <SectionHeading size="h3" className="text-balance">
                            Out by nine, *home before dark*
                        </SectionHeading>
                        <p className="mx-auto mt-5 max-w-[520px] text-[16px]/[1.6] text-ink-muted">
                            Short excursions around Bengaluru, once or twice a month. No packing, no
                            leave to arrange, and the same company you would meet on a departure.
                        </p>
                    </div>

                    <div
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[clamp(18px,2vw,28px)]"
                    >
                        {dayOuts.map((item) => (
                            <article key={item.title} data-voy-card>
                                <div className="overflow-hidden rounded-[10px]">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        loading="lazy"
                                        data-voy-img
                                        className="h-[240px] w-full object-cover"
                                    />
                                </div>
                                <h3 className="mt-[18px] mb-2 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                    {item.title}
                                </h3>
                                <p className="text-[15px]/[1.55] text-ink-muted">{item.body}</p>
                            </article>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section id="request">
                <Container className="max-w-[880px]">
                    <div className="mb-[clamp(32px,4vw,44px)] text-center">
                        <Eyebrow className="mb-[18px]">Get the schedule</Eyebrow>
                        <SectionHeading size="h3" className="text-balance">
                            Tell us what you would like to *try*
                        </SectionHeading>
                        <p className="mx-auto mt-5 max-w-[520px] text-[16px]/[1.6] text-ink-muted">
                            New batches open every month and the small ones fill within days. Leave
                            your details and we will send you the dates as they are announced.
                        </p>
                    </div>

                    <EnquiryForm
                        id="workshops"
                        subject="the Silver Space workshops and day-outs"
                        submitLabel="Send me the schedule"
                    />
                </Container>
            </Section>

            <CtaBand
                heading="Ready to go *further*?"
                body="The workshops are how most members meet each other. The departures are where the friendships get made."
                action={{ label: 'See upcoming tours', href: paths.groupTours }}
            />
        </>
    );
}
