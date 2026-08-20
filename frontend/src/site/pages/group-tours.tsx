'use client';

import { useMemo, useState } from 'react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { PageHero } from '@/site/components/page-hero';
import { TourCard } from '@/site/components/tour-card';
import { monthLabel, tourMonths, tourPromises, tours } from '@/site/data/tours';
import { cn } from '@/shared/lib/utils';

type Filter = { key: string; label: string };

const regionFilters: Filter[] = [
    { key: 'all', label: 'All destinations' },
    { key: 'India', label: 'India' },
    { key: 'International', label: 'International' },
];

/**
 * Every upcoming departure.
 *
 * The two filters are client state rather than query parameters on purpose:
 * the whole catalogue is already in the markup the server sent, so narrowing it
 * is a hide, not a fetch. That keeps every tour crawlable — a search engine
 * reads all twenty from the first response — while a visitor gets an instant
 * filter with no round trip. If the catalogue ever outgrows one page, this
 * becomes a server-side query and the cards do not change.
 */
export default function GroupToursPage() {
    const [region, setRegion] = useState('all');
    const [month, setMonth] = useState('all');

    const monthFilters: Filter[] = [
        { key: 'all', label: 'Every month' },
        ...tourMonths.map((value) => ({ key: value, label: monthLabel(value) })),
    ];

    const visible = useMemo(
        () =>
            tours.filter(
                (tour) =>
                    (region === 'all' || tour.region === region) &&
                    (month === 'all' || tour.month === month),
            ),
        [region, month],
    );

    return (
        <>
            <PageHero
                eyebrow="Group tours"
                title="We travel to *live and laugh*."
                lead="Leisurely-paced departures across India and the world, in groups of twelve to sixteen, with everyone aboard fifty or over. Age is no bar — it never was."
                facts={[
                    { label: 'Upcoming departures', value: String(tours.length) },
                    { label: 'Guests per group', value: '12–16' },
                    { label: 'Destinations', value: '90+' },
                    { label: 'Trips hosted', value: '1,000+' },
                ]}
            />

            <Section top="sm" bottom="none">
                <Container>
                    <div className="mx-auto max-w-[640px] text-center">
                        <Eyebrow className="mb-[18px]">Upcoming departures</Eyebrow>
                        <SectionHeading className="text-balance">
                            Where we&apos;re *headed* next
                        </SectionHeading>
                    </div>

                    {/* Scrolls horizontally on narrow screens rather than wrapping. */}
                    <div className="-mx-gutter mt-[clamp(32px,4vw,44px)] flex gap-[clamp(18px,3vw,40px)] overflow-x-auto px-gutter pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
                        {monthFilters.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => setMonth(filter.key)}
                                aria-pressed={month === filter.key}
                                className={cn(
                                    'pb-2 text-[13px] tracking-[0.12em] whitespace-nowrap transition-colors',
                                    month === filter.key
                                        ? 'border-b-2 border-brand font-extrabold text-brand'
                                        : 'border-b-2 border-transparent font-bold text-ink-muted hover:text-ink',
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-7 mb-[clamp(36px,4vw,52px)] flex flex-wrap justify-center gap-2.5">
                        {regionFilters.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => setRegion(filter.key)}
                                aria-pressed={region === filter.key}
                                className={cn(
                                    'rounded-full border px-[18px] py-2.5 text-[13px] font-bold tracking-[0.04em] transition-colors',
                                    region === filter.key
                                        ? 'border-brand bg-brand text-white'
                                        : 'border-hairline text-ink hover:border-brand hover:text-brand',
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <p className="mb-8 text-center text-[13px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                        Showing {visible.length} of {tours.length} departures
                    </p>

                    {visible.length > 0 ? (
                        <div
                            data-voy-group
                            className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-x-[clamp(18px,2vw,28px)] gap-y-[clamp(36px,4vw,52px)]"
                        >
                            {visible.map((tour) => (
                                <TourCard key={tour.slug} tour={tour} />
                            ))}
                        </div>
                    ) : (
                        <p className="mx-auto max-w-[46ch] py-12 text-center text-[17px]/[1.6] text-ink-muted">
                            Nothing on the calendar for that combination yet. Try another month, or
                            tell us where you would like to go — a good number of our departures
                            start as a request.
                        </p>
                    )}
                </Container>
            </Section>

            <Section>
                <Container>
                    <div className="mx-auto mb-[clamp(44px,5vw,64px)] max-w-[640px] text-center">
                        <Eyebrow className="mb-[18px]">On every departure</Eyebrow>
                        <SectionHeading size="h3">
                            The same *four promises*, everywhere we go
                        </SectionHeading>
                    </div>

                    <ol
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[clamp(28px,3vw,44px)]"
                    >
                        {tourPromises.map((promise, i) => (
                            <li key={promise.title} className="border-t-2 border-brand pt-[22px]">
                                <div className="mb-3.5 font-serif text-2xl font-normal text-ink-muted opacity-60">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <h3 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                    {promise.title}
                                </h3>
                                <p className="text-[15px]/[1.58] text-ink-muted">{promise.body}</p>
                            </li>
                        ))}
                    </ol>
                </Container>
            </Section>

            <CtaBand
                heading="Not seeing *your* destination?"
                body="Tell us where you have always wanted to go. A good many of our departures began as one member's request."
            />
        </>
    );
}
