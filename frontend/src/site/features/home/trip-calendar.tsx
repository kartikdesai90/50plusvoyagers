'use client';

import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Container, Eyebrow, RuleLink, Section, SectionHeading } from '@/site/components/section';
import { SiteImage } from '@/site/components/site-image';
import { trips, type Trip } from '@/site/data/home';
import { cn } from '@/shared/lib/utils';

/**
 * The key a departure is filed under: the month it leaves in.
 *
 * Taken off the front of the ISO date rather than through `Date`, which would
 * read "2026-08-09" as midnight UTC and hand back July to anybody west of it.
 * A departure's month is a fact about the departure, not about where the
 * browser is sitting.
 */
const monthKey = (trip: Trip) => trip.date.slice(0, 7);

const MONTH_NAMES = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
];

/** `2026-08` as the row prints it: `AUG '26`. */
function monthLabel(key: string): string {
    const [year, month] = key.split('-');

    return `${MONTH_NAMES[Number(month) - 1]} '${year.slice(2)}`;
}

/** `2026-08-09` as the card prints it: `9 Aug 2026`. */
function departureLabel(date: string): string {
    const [year, month, day] = date.split('-');

    const name = MONTH_NAMES[Number(month) - 1];

    return `${Number(day)} ${name.charAt(0)}${name.slice(1).toLowerCase()} ${year}`;
}

/**
 * The departures, by the month they leave in.
 *
 * The month row is built from the trips rather than kept beside them. A hand-
 * written list is a list that goes stale the first time a departure is added or
 * sells out — and a tab that filters the section down to nothing is worse than
 * no tab at all, because the visitor did what the page invited them to do and
 * the page emptied.
 *
 * Sorted by date throughout, so both the row and the cards under it run
 * forwards in time however the data happens to be ordered.
 */
export function TripCalendar() {
    const departures = useMemo(
        () => [...trips].sort((a, b) => a.date.localeCompare(b.date)),
        [],
    );

    const months = useMemo(
        () => [...new Set(departures.map(monthKey))],
        [departures],
    );

    /* The soonest month, which is the one a visitor is most likely to want. */
    const [active, setActive] = useState(() => months[0] ?? '');

    const shown = useMemo(
        () => departures.filter((trip) => monthKey(trip) === active),
        [departures, active],
    );

    if (departures.length === 0) return null;

    return (
        <Section id="trips" bottom="none">
            <Container>
                <div className="mx-auto max-w-[640px] text-center">
                    <Eyebrow className="mb-[18px]">Upcoming departures</Eyebrow>
                    <SectionHeading className="text-balance">
                        Where we&apos;re *headed* next
                    </SectionHeading>
                </div>

                {/*
                 * Wraps onto as many rows as it needs rather than scrolling
                 * sideways. A row of months that runs off the edge of a phone
                 * hides half the year behind a gesture nothing signals, and the
                 * eight tabs fit two comfortable rows at that width.
                 *
                 * Buttons rather than styled spans: this moves something on the
                 * page, so it has to be reachable by keyboard and announce which
                 * one is current.
                 */}
                <div
                    data-voy-group
                    role="tablist"
                    aria-label="Departure month"
                    className="my-[clamp(24px,4vw,34px)] mb-[clamp(30px,4vw,44px)] flex flex-wrap justify-center gap-x-[clamp(16px,3vw,40px)] gap-y-3"
                >
                    {months.map((month) => {
                        const current = month === active;

                        return (
                            <button
                                key={month}
                                type="button"
                                role="tab"
                                aria-selected={current}
                                onClick={() => setActive(month)}
                                className={cn(
                                    'cursor-pointer pb-2 text-[13px] tracking-[0.12em] whitespace-nowrap transition-colors',
                                    current
                                        ? 'border-b-2 border-brand font-extrabold text-brand'
                                        : 'font-bold text-ink-muted hover:text-ink',
                                )}
                            >
                                {monthLabel(month)}
                            </button>
                        );
                    })}
                </div>

                <div
                    data-voy-group
                    className="grid grid-cols-[repeat(auto-fit,minmax(min(290px,100%),1fr))] gap-[clamp(18px,2vw,28px)]"
                >
                    {shown.map((trip) => (
                        <article key={`${trip.title}-${trip.date}`}>
                            <a
                                href="#trips"
                                className="group relative block overflow-hidden rounded-[10px]"
                            >
                                <div className="relative h-[clamp(340px,34vw,420px)] w-full">
                                    <SiteImage
                                        src={trip.src}
                                        alt={trip.title}
                                        /* Three across on desktop, one on a phone. */
                                        sizes="(max-width: 700px) 100vw, (max-width: 1180px) 50vw, 380px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.86)] via-[rgb(16_15_12/0.3)] via-48% to-transparent to-80% p-6">
                                    <span className="mb-3.5 self-start rounded-full border border-white/55 px-[11px] py-[5px] text-[10.5px] font-bold tracking-[0.16em] uppercase">
                                        {trip.tag}
                                    </span>
                                    <div className="mb-3.5 text-[15px] text-white/85">
                                        {departureLabel(trip.date)} · {trip.nights}
                                    </div>
                                    <span className="inline-flex items-center gap-2 border-t border-white/30 pt-3.5 text-sm font-bold tracking-[0.03em]">
                                        View trip
                                        <ArrowRight className="size-[15px]" aria-hidden="true" />
                                    </span>
                                </div>
                            </a>
                            <div className="mt-4 flex items-baseline justify-between gap-3">
                                <h3 className="font-serif text-[21px] font-medium tracking-[-0.01em] text-ink">
                                    {trip.title}
                                </h3>
                                <div className="text-[15px] font-bold whitespace-nowrap text-brand">
                                    {trip.price}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-[clamp(40px,5vw,60px)] text-center">
                    <RuleLink href="#trips" className="text-[13px]">
                        See all departures
                    </RuleLink>
                </div>
            </Container>
        </Section>
    );
}
