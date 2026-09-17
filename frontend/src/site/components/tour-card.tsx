import { ArrowRight, ImageOff } from 'lucide-react';

import { NavLink } from '@/site/components/nav-link';
import { groupTourPath } from '@/routes/paths';
import type { Tour } from '@/site/data/tours';

/**
 * One departure, as a card.
 *
 * The card, singular: the homepage's calendar and the group tours listing both
 * draw this one. They were two implementations of the same thing, which is how
 * the same departure came to read two different ways on two pages a click
 * apart.
 *
 * The layout is the original design's, and everything in it is now dynamic:
 *
 *   - a pill over the photograph — the editor's ribbon where one is written,
 *     the region otherwise;
 *   - the departure date and the duration on one line beneath it;
 *   - "View trip" under a hairline rule;
 *   - the title and the price on a shared baseline below the frame.
 *
 * The facts sit inside the scrim rather than under the card. That was the
 * design's own decision and it is the right one here: the card is read as a
 * picture with a caption, and moving the date out from under the photograph
 * left the frame saying nothing but a place name.
 *
 * A `slug` may be empty. The homepage falls back to the design's own departures
 * until tours are migrated, and those describe a trip without being one — there
 * is no page to open. Such a card is a card rather than a link: "View trip"
 * that goes nowhere is the one thing on that page a visitor is certain to
 * click.
 */
export function TourCard({ tour }: { tour: Tour }) {
    const frameClass = 'group relative block overflow-hidden rounded-[10px]';

    /* The date and the duration read as one fact — "16 Aug 2026 · 7 nights" —
       and either half may be missing on a tour the CRM has no departure for. */
    const when = [tour.departs, tour.duration].filter(Boolean).join(' · ');

    /*
     * The photograph and the scrim over it, written once and wrapped either
     * way. `NavLink` takes a closed set of props built around a required
     * `href`, so it cannot stand in for a `div` through a component variable —
     * the two branches are spelled out instead.
     */
    const media = (
        <>
            {/*
             * A tour with no photograph filed against it still gets a frame.
             *
             * A bare `<img>` pointed at an empty string does not draw nothing —
             * it draws a broken-image box with the alt text beside it, which is
             * what a newly-created tour looked like until its first picture was
             * uploaded. Dropping the image instead would be worse: the card
             * would lose its height and sit out of line with every card beside
             * it.
             *
             * So the ratio is held either way, and the empty state says plainly
             * that a picture is still to come. Nothing is borrowed from another
             * trip to fill the gap: a card showing a place this tour does not
             * visit is worse than a card admitting it has no photograph yet.
             */}
            {tour.image ? (
                <img
                    src={tour.image}
                    alt={tour.title}
                    loading="lazy"
                    data-voy-img
                    /* 4:5 rather than 14:15 — a 340px track is what lets three
                       cards fit a desktop row, and at the old ratio that made
                       the card too short. A ratio rather than a viewport
                       height, so it cannot drift if the track changes again. */
                    className="aspect-[4/5] w-full object-cover"
                />
            ) : (
                <div
                    data-voy-img
                    className="flex aspect-[4/5] w-full items-center justify-center bg-surface-alt"
                >
                    <ImageOff
                        className="size-7 text-ink-muted/40"
                        strokeWidth={1.5}
                        aria-hidden="true"
                    />
                </div>
            )}

            <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.86)] via-[rgb(16_15_12/0.3)] via-48% to-transparent to-80% p-6">
                {/*
                 * The pill the design carries. It held a comfort grade —
                 * "Deluxe", "Comfort" — which is not something the CRM records,
                 * so what prints here is the editor's own ribbon for the tour
                 * ("Stay in a coffee estate") and the region where none is
                 * written. Same pill, filled from the data that exists.
                 */}
                {tour.region ? (
                    <span className="mb-3.5 self-start rounded-full border border-white/55 px-[11px] py-[5px] text-[10.5px] font-bold tracking-[0.16em] uppercase">
                        {tour.region}
                    </span>
                ) : null}

                {when ? <div className="mb-3.5 text-[15px] text-white/85">{when}</div> : null}

                <span className="inline-flex items-center gap-2 border-t border-white/30 pt-3.5 text-sm font-bold tracking-[0.03em]">
                    View trip
                    <ArrowRight className="size-[15px]" aria-hidden="true" />
                </span>
            </div>
        </>
    );

    return (
        <article data-voy-card>
            {tour.slug ? (
                <NavLink href={groupTourPath(tour.slug)} className={frameClass}>
                    {media}
                </NavLink>
            ) : (
                <div className={frameClass}>{media}</div>
            )}

            <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-[21px]/[1.2] font-medium tracking-[-0.01em] text-ink">
                    {tour.slug ? (
                        <NavLink
                            href={groupTourPath(tour.slug)}
                            className="transition-colors hover:text-brand"
                        >
                            {tour.title}
                        </NavLink>
                    ) : (
                        tour.title
                    )}
                </h3>
                <div className="text-[15px] font-bold whitespace-nowrap text-brand">
                    {tour.price}
                </div>
            </div>
        </article>
    );
}
