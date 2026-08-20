'use client';

import { CalendarDays, Check, Clock, MapPin, Users, X } from 'lucide-react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { EnquiryForm } from '@/site/components/enquiry-form';
import { TourCard } from '@/site/components/tour-card';
import { CtaBand } from '@/site/components/cta-band';
import { paths } from '@/routes/paths';
import { siteConfig } from '@/site/config/site';
import {
    findTour,
    itineraryFor,
    tourExclusions,
    tourInclusions,
    tourPromises,
    tours,
    type Tour,
} from '@/site/data/tours';

type GroupTourPageProps = {
    /** The slug the route matched. The record itself is still resolved on the
     *  client, because the catalogue is static — when it moves to the database
     *  the controller passes the record instead and only this line changes. */
    slug: string;
};

const facts = (tour: Tour) => [
    { icon: CalendarDays, label: 'Departs', value: tour.departs },
    { icon: Clock, label: 'Duration', value: tour.duration },
    { icon: Users, label: 'Group size', value: '12–16 guests' },
    { icon: MapPin, label: 'Region', value: tour.region },
];

/**
 * The case for this departure in particular.
 *
 * Read off the record rather than written per tour, for the same reason the
 * itinerary is: twenty hand-written versions is twenty things to fall out of
 * step with the fields above them. Every line here is a restatement of
 * something already true on the record — how many places, how long, which
 * month, which region — so it cannot claim anything the page does not.
 */
const reasons = (tour: Tour) => [
    {
        title: 'The route',
        body: `${tour.places.length} places across ${tour.duration.toLowerCase()}, in an order that keeps the drives short and the days unhurried.`,
    },
    {
        title: 'The season',
        body: `Timed for ${tour.departs} — chosen because it is when ${tour.places[0]} is at its most comfortable to travel in.`,
    },
    {
        title: 'The company',
        body: 'Twelve to sixteen travellers, all over fifty, most of them booking on their own. Nobody is the odd one out.',
    },
];

/**
 * One departure in full.
 *
 * The layout is the homepage's two-column "why us" band promoted to a page: the
 * substance on the left at a comfortable reading measure, and a booking panel
 * on the right that sticks to the viewport on desktop and simply follows the
 * content on anything narrower.
 */
export default function GroupTourPage({ slug }: GroupTourPageProps) {
    const tour = findTour(slug);

    if (!tour) {
        return (
            <Section>
                <Container className="max-w-[600px] py-12 text-center">
                    <SectionHeading size="h3">We could not find that tour</SectionHeading>
                    <p className="mt-4 text-[17px]/[1.6] text-ink-muted">
                        It may have departed already. The full calendar is on the{' '}
                        <a href={paths.groupTours} className="font-semibold text-brand underline">
                            group tours page
                        </a>
                        .
                    </p>
                </Container>
            </Section>
        );
    }

    const others = tours.filter((other) => other.slug !== tour.slug).slice(0, 3);
    const itinerary = itineraryFor(tour);

    return (
        <>
            <Section top="sm" bottom="none">
                <Container>
                    <div className="max-w-[760px]">
                        <Eyebrow className="mb-[18px]">
                            {tour.region} · {tour.duration}
                        </Eyebrow>
                        <h1 className="voy-heading text-[clamp(34px,5vw,60px)] [line-height:1.03] tracking-[-0.025em]">
                            {tour.title}
                        </h1>
                        <p className="mt-6 max-w-[620px] text-[clamp(16px,1.4vw,19px)]/[1.6] text-ink-muted">
                            {tour.summary}
                        </p>
                    </div>

                    <div className="voy-hero-media mt-[clamp(36px,4vw,52px)]">
                        <img
                            src={tour.image}
                            alt={tour.title}
                            className="size-full object-cover"
                            fetchPriority="high"
                        />
                    </div>

                    <ul
                        data-voy-group
                        className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-6 gap-y-7 border-y border-hairline py-8"
                    >
                        {facts(tour).map(({ icon: Icon, label, value }) => (
                            <li key={label} className="flex items-start gap-3">
                                <Icon
                                    className="mt-0.5 size-[18px] shrink-0 text-brand"
                                    strokeWidth={1.7}
                                    aria-hidden="true"
                                />
                                <span>
                                    <span className="block text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                        {label}
                                    </span>
                                    <span className="mt-1 block text-[15.5px] font-semibold text-ink">
                                        {value}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </Container>
            </Section>

            <Section top="sm">
                <Container>
                    <div className="grid items-start gap-[clamp(36px,4vw,64px)] lg:grid-cols-[1fr_380px]">
                        <div>
                            {/*
                              * The day-by-day. Numbered in the homepage's own
                              * hand — the serif ordinal over a brand rule that
                              * "fully hosted" uses for its steps — so a reader
                              * arriving from the homepage meets a list they
                              * already know how to read.
                              */}
                            {itinerary.length > 0 ? (
                                <section className="mb-[clamp(40px,4.5vw,60px)]">
                                    <SectionHeading
                                        size="h3"
                                        className="mb-6 text-[clamp(26px,3vw,36px)]"
                                    >
                                        Day *by* day
                                    </SectionHeading>

                                    <ol className="flex flex-col">
                                        {itinerary.map((day) => (
                                            <li
                                                key={day.day}
                                                className="grid grid-cols-[auto_1fr] gap-x-[clamp(16px,2vw,26px)] border-b border-hairline py-[22px] first:pt-0 last:border-b-0 last:pb-0"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                                        Day
                                                    </span>
                                                    <span className="font-serif text-[26px]/none text-brand">
                                                        {String(day.day).padStart(2, '0')}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h4 className="text-[17px] font-semibold text-ink">
                                                        {day.title}
                                                    </h4>
                                                    <p className="mt-2 text-[15.5px]/[1.6] text-ink-muted">
                                                        {day.body}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            ) : null}

                            {/*
                              * Why this one rather than the others. Built from
                              * the record itself — the places, the length, the
                              * region — so it argues for the trip in front of
                              * the reader rather than for the club in general,
                              * which is what "How we host it" already does.
                              */}
                            <section className="mb-[clamp(40px,4.5vw,60px)]">
                                <SectionHeading
                                    size="h3"
                                    className="mb-6 text-[clamp(26px,3vw,36px)]"
                                >
                                    Why this *trip*
                                </SectionHeading>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(24px,3vw,36px)]">
                                    {reasons(tour).map((reason) => (
                                        <div
                                            key={reason.title}
                                            className="border-t-2 border-brand pt-[18px]"
                                        >
                                            <h4 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                                {reason.title}
                                            </h4>
                                            <p className="text-[15px]/[1.58] text-ink-muted">
                                                {reason.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="mb-[clamp(40px,4.5vw,60px)]">
                                <SectionHeading
                                    size="h3"
                                    className="mb-6 text-[clamp(26px,3vw,36px)]"
                                >
                                    Trip *highlights*
                                </SectionHeading>
                                <ul className="flex flex-col gap-4">
                                    {tour.highlights.map((highlight) => (
                                        <li
                                            key={highlight}
                                            className="flex items-start gap-[13px] text-[16.5px]/[1.6] text-ink"
                                        >
                                            <Check
                                                className="mt-1 size-5 shrink-0 text-brand"
                                                strokeWidth={1.7}
                                                aria-hidden="true"
                                            />
                                            {highlight}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="mb-[clamp(40px,4.5vw,60px)]">
                                <SectionHeading
                                    size="h3"
                                    className="mb-6 text-[clamp(26px,3vw,36px)]"
                                >
                                    What&apos;s *included*
                                </SectionHeading>
                                <ul className="mb-9 flex flex-col gap-3.5">
                                    {tourInclusions.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-[13px] text-[15.5px]/[1.6] text-ink-muted"
                                        >
                                            <Check
                                                className="mt-1 size-[18px] shrink-0 text-brand"
                                                strokeWidth={1.7}
                                                aria-hidden="true"
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <h3 className="mb-4 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                    Not included
                                </h3>
                                <ul className="flex flex-col gap-3.5">
                                    {tourExclusions.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-[13px] text-[15.5px]/[1.6] text-ink-muted"
                                        >
                                            <X
                                                className="mt-1 size-[18px] shrink-0 opacity-45"
                                                strokeWidth={1.7}
                                                aria-hidden="true"
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section>
                                <SectionHeading
                                    size="h3"
                                    className="mb-6 text-[clamp(26px,3vw,36px)]"
                                >
                                    How we *host* it
                                </SectionHeading>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(24px,3vw,36px)]">
                                    {tourPromises.map((promise) => (
                                        <div
                                            key={promise.title}
                                            className="border-t-2 border-brand pt-[18px]"
                                        >
                                            <h4 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                                {promise.title}
                                            </h4>
                                            <p className="text-[15px]/[1.58] text-ink-muted">
                                                {promise.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <aside className="lg:sticky lg:top-[120px]">
                            <div className="rounded-2xl border border-hairline bg-surface-alt p-[clamp(24px,3vw,32px)]">
                                <p className="text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                    From
                                </p>
                                <p className="mt-2 font-serif text-[clamp(32px,3.6vw,42px)]/none text-ink">
                                    {tour.price}
                                </p>
                                <p className="mt-2.5 text-[14px] text-ink-muted">
                                    per person, twin sharing
                                </p>

                                <dl className="mt-7 flex flex-col gap-3.5 border-t border-hairline pt-6 text-[14.5px]">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-ink-muted">Departs</dt>
                                        <dd className="font-semibold text-ink">{tour.departs}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-ink-muted">Duration</dt>
                                        <dd className="font-semibold text-ink">{tour.duration}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-ink-muted">Group size</dt>
                                        <dd className="font-semibold text-ink">12–16</dd>
                                    </div>
                                </dl>

                                <p className="mt-7 border-t border-hairline pt-6 text-[14px]/[1.6] text-ink-muted">
                                    Members pay a reduced early-bird price and can spread the cost
                                    across instalments. Call{' '}
                                    <a
                                        href={siteConfig.enquiryPhoneHref}
                                        className="font-semibold text-brand"
                                    >
                                        {siteConfig.enquiryPhone}
                                    </a>{' '}
                                    to hold a seat.
                                </p>
                            </div>

                            <EnquiryForm
                                id={`tour-${tour.slug}`}
                                subject={tour.title}
                                title="Enquire about this trip"
                                submitLabel="Request details"
                                className="mt-6"
                            />
                        </aside>
                    </div>
                </Container>
            </Section>

            <Section tone="alt">
                <Container>
                    <div className="mb-[clamp(28px,3vw,40px)]">
                        <Eyebrow className="mb-[18px]">You might also like</Eyebrow>
                        <SectionHeading size="h3">Other *departures*</SectionHeading>
                    </div>

                    <div
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(18px,2vw,28px)]"
                    >
                        {others.map((other) => (
                            <TourCard key={other.slug} tour={other} />
                        ))}
                    </div>
                </Container>
            </Section>

            <CtaBand tone="surface" />
        </>
    );
}
