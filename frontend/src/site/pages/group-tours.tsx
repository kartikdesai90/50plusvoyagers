'use client';

import { useMemo, useState } from 'react';

import { Container, Section } from '@/site/components/section';
import { PageHero } from '@/site/components/page-hero';
import { TourCard } from '@/site/components/tour-card';
import { monthLabel, type Tour } from '@/site/data/tours';
import { cn } from '@/shared/lib/utils';

type Filter = { key: string; label: string };

/**
 * Every upcoming departure.
 *
 * The page is the catalogue and nothing else: a heading, the month tabs, the
 * grid. The promises block and the enquiry band that used to sit under it were
 * both answers to questions a visitor asks *after* a trip has caught their eye,
 * and every tour page already gives them at the point they are actually wanted.
 * Here they were three screens between a browser and the next page of cards.
 *
 * The tours arrive as a prop, fetched by the route on the server. This used to
 * import the shipped catalogue directly, which meant the listing showed twenty
 * departures the database had never heard of while the homepage beside it
 * showed the two that were really published.
 *
 * The month filter is client state rather than a query parameter on purpose:
 * the whole catalogue is already in the markup the server sent, so narrowing it
 * is a hide, not a fetch. That keeps every tour crawlable — a search engine
 * reads them all from the first response — while a visitor gets an instant
 * filter with no round trip. If the catalogue ever outgrows one page, this
 * becomes a server-side query and the cards do not change.
 *
 * Month is the only filter. A region row used to sit under it, but region is
 * printed on every card as its category tag, which is the cheaper way to answer
 * "is this one abroad?" — a second control that narrows the grid by a third
 * earns less than the space it costs.
 */
export default function GroupToursPage({ tours }: { tours: Tour[] }) {
    const [month, setMonth] = useState('all');

    /*
     * The tabs are built from the tours in hand rather than from the shipped
     * catalogue's months. A tab that filters the grid down to nothing is worse
     * than no tab at all: the visitor did what the page invited them to do and
     * the page emptied.
     */
    const monthFilters: Filter[] = useMemo(() => {
        const months = [...new Set(tours.map((tour) => tour.month).filter(Boolean))].sort();

        /* "All dates" rather than "Every month": the row is a date filter and
           the rest of it is dates, so the reset reads as the one that clears
           them rather than as another month beside SEP, OCT and NOV. */
        return [
            { key: 'all', label: 'All dates' },
            ...months.map((value) => ({ key: value, label: monthLabel(value) })),
        ];
    }, [tours]);

    const visible = useMemo(
        () => tours.filter((tour) => month === 'all' || tour.month === month),
        [tours, month],
    );

    return (
        <>
            {/* Carries the page's only heading, so the grid is not a bare wall
                of cards and the route still has the h1 its metadata promises. */}
            <PageHero
                eyebrow="Group tours"
                title="We travel to *live and laugh*."
                lead="Leisurely-paced departures across India and the world, in groups of twelve to sixteen, with everyone aboard fifty or over. Age is no bar — it never was."
            />

            {/*
             * `top="none"`, because the hero already pays for this seam.
             *
             * The hero closes with `sm` whenever it has no facts row or image to
             * sit under — and stripping the statistics off it is what put it in
             * that state. Two `sm` spaces facing each other is ~160px of empty
             * page between the lead and the month tabs, which is the gap the
             * stat row used to stand in. Same ground either side, so one gives.
             */}
            <Section top="none">
                <Container>
                    {/*
                     * Only worth drawing when there is a choice to make. One
                     * month of departures produces "All dates" beside a single
                     * tab, both of which show the same grid.
                     */}
                    {monthFilters.length > 2 ? (
                        /* Scrolls horizontally on narrow screens rather than wrapping. */
                        <div className="-mx-gutter mb-[clamp(36px,4vw,52px)] flex gap-[clamp(18px,3vw,40px)] overflow-x-auto px-gutter pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
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
                    ) : null}

                    {visible.length > 0 ? (
                        <div
                            data-voy-group
                            /*
                             * Tracks are capped and the row is centred, so a
                             * filter that matches one departure shows a card
                             * rather than a panorama.
                             *
                             * `auto-fit` collapses the tracks nothing lands in
                             * and hands their width to the survivors, which is
                             * what a full grid wants and exactly wrong at the
                             * end of a filter: one card inherited the whole
                             * container and stretched its photograph across it.
                             * Capping the track stops the stretch, and centring
                             * what is left keeps one or two cards under the
                             * heading instead of hard against the left edge.
                             *
                             * The cap is 340px, and the number is load-bearing
                             * rather than taste. The container is 1180px less
                             * the gutter, which caps at 44px a side — so a
                             * desktop row has 1092px to divide. Three 380px
                             * tracks and two 28px gaps came to 1196px, over by
                             * a hundred, and `auto-fit` answered by dropping to
                             * two cards across on the widest screens. At 340px
                             * the same row is 1076px and three fit, which is
                             * what a listing of departures should show.
                             */
                            className="grid grid-cols-[repeat(auto-fit,minmax(min(290px,100%),340px))] justify-center gap-x-[clamp(18px,2vw,28px)] gap-y-[clamp(36px,4vw,52px)]"
                        >
                            {visible.map((tour) => (
                                <TourCard key={tour.slug} tour={tour} />
                            ))}
                        </div>
                    ) : (
                        <p className="mx-auto max-w-[46ch] py-12 text-center text-[17px]/[1.6] text-ink-muted">
                            Nothing on the calendar for that month yet. Try another month, or tell
                            us where you would like to go — a good number of our departures start as
                            a request.
                        </p>
                    )}
                </Container>
            </Section>
        </>
    );
}
