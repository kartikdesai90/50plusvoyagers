'use client';

import { useMemo, useState } from 'react';

import { Container, Eyebrow, RuleLink, Section, SectionHeading } from '@/site/components/section';
import { TourCard } from '@/site/components/tour-card';
import { trips } from '@/site/data/home';
import type { Tour } from '@/site/data/tours';
/* The wire shape, aliased: `TourCard` above is the component that draws one. */
import type { TourCard as TourCardData } from '@/site/data/tour-content';
import { paths } from '@/routes/paths';
import { cn } from '@/shared/lib/utils';

/**
 * The key a departure is filed under: the month it leaves in.
 *
 * Taken off the front of the ISO date rather than through `Date`, which would
 * read "2026-08-09" as midnight UTC and hand back July to anybody west of it.
 * A departure's month is a fact about the departure, not about where the
 * browser is sitting.
 */
const monthKey = (tour: { month: string }) => tour.month;

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
export function TripCalendar({ tours = [] }: { tours?: TourCardData[] }) {
    /*
     * Real tours where there are any, the design's own departures otherwise.
     *
     * Both are resolved into the one shape {@see TourCard} draws, so a
     * departure looks the same here as it does on the listing. They were two
     * card implementations until now, which is how this band came to show a
     * "Deluxe" tag where the listing showed a region.
     *
     * The fallback is a fallback, not a peer: a mockup departure has no
     * address, so `slug` is empty and its card renders as a card rather than as
     * a link to a page that does not exist.
     */
    const departures = useMemo<Tour[]>(() => {
        /*
         * Only departures with a date. The calendar is filed by month, so a
         * tour the CRM has no departure for has no shelf to sit on — it is
         * still reachable from the listing and from search, just not from a
         * month tab that would have to invent one for it.
         */
        const real: Tour[] = tours
            .filter((tour) => Boolean(tour.starts_on))
            /*
             * Sorted on the ISO date, before it becomes a printed one.
             * `departureLabel` returns "14 April 2027", and comparing those as
             * text files April ahead of November — the row of month tabs would
             * run in alphabetical order rather than forwards in time.
             */
            .sort((a, b) => String(a.starts_on).localeCompare(String(b.starts_on)))
            .map((tour) => {
                const date = String(tour.starts_on).slice(0, 10);

                return {
                    slug: tour.slug,
                    title: tour.title,
                    region: tour.ribbon_text ?? tour.region ?? '',
                    month: date.slice(0, 7),
                    departs: departureLabel(date),
                    duration: tour.nights ? `${tour.nights} nights` : '',
                    price: tour.price ? `₹${tour.price.toLocaleString('en-IN')}` : 'On request',
                    /*
                     * Nothing is borrowed from another trip. This band used to
                     * lend an unphotographed tour a picture from the design's
                     * library, which kept the row looking finished at the cost
                     * of showing a place the tour does not visit — Japan wore a
                     * photograph of Bhutan. The card has an empty state for
                     * exactly this, and an honest gap is also the only thing
                     * that tells anyone a photograph is still needed.
                     */
                    image: tour.image_url ?? '',
                    places: [],
                    summary: '',
                    highlights: [],
                };
            });

        if (real.length > 0) {
            return real;
        }

        return [...trips]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((trip) => ({
                /* No page to open: these describe a trip without being one. */
                slug: '',
                title: trip.title,
                region: trip.tag,
                month: trip.date.slice(0, 7),
                departs: departureLabel(trip.date),
                duration: trip.nights,
                price: trip.price,
                image: trip.src,
                places: [],
                summary: '',
                highlights: [],
            }));
    }, [tours]);

    const months = useMemo(() => [...new Set(departures.map(monthKey))], [departures]);

    /* The soonest month, which is the one a visitor is most likely to want. */
    const [active, setActive] = useState(() => months[0] ?? '');

    const shown = useMemo(
        () => departures.filter((tour) => monthKey(tour) === active),
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
                    /*
                     * Capped and centred, for the months with one departure in
                     * them.
                     *
                     * `auto-fit` hands the width of the tracks nothing lands in
                     * to the tracks that survive — right for a full row, and
                     * wrong here more often than on the listing, because this
                     * section opens already filtered to the soonest month. A
                     * month with a single trip in it rendered that trip as a
                     * full-width panorama on the homepage, on load.
                     *
                     * `min(290px,100%)` stays as the floor: it is what keeps the
                     * 290px minimum from overflowing a viewport narrower than
                     * 290px. Only the ceiling changes.
                     */
                    /* 340px, not 380: three tracks and their gaps have to fit
                       the 1092px a desktop row actually has once the gutter is
                       taken off, or `auto-fit` drops the row to two cards. The
                       listing grid is capped the same, so a departure looks the
                       same in both places. */
                    className="grid grid-cols-[repeat(auto-fit,minmax(min(290px,100%),340px))] justify-center gap-[clamp(18px,2vw,28px)]"
                >
                    {/*
                     * The listing's card, not one of this band's own.
                     *
                     * It handles the address (a mockup departure has none and
                     * renders as a card rather than a link), the missing
                     * photograph, and the facts underneath — so a departure
                     * reads identically here and on the group tours page.
                     */}
                    {shown.map((tour) => (
                        <TourCard key={`${tour.title}-${tour.month}`} tour={tour} />
                    ))}
                </div>

                <div className="mt-[clamp(40px,5vw,60px)] text-center">
                    <RuleLink href={paths.groupTours} className="text-[13px]">
                        See all departures
                    </RuleLink>
                </div>
            </Container>
        </Section>
    );
}
