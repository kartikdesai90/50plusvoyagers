import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';

import { NavLink } from '@/site/components/nav-link';
import { groupTourPath } from '@/routes/paths';
import type { Tour } from '@/site/data/tours';

/**
 * One departure, as a card.
 *
 * Lifted wholesale from the homepage's trip calendar so a tour looks the same
 * wherever it appears: the same photo ratio, the same hover scrim, the same
 * title-and-price baseline row underneath. What this adds is the pair of facts
 * a listing page needs that a homepage teaser does not — the region and the
 * date — placed above the fold of the card rather than inside the scrim, since
 * a visitor scanning twenty departures should not have to hover to compare.
 */
export function TourCard({ tour }: { tour: Tour }) {
    return (
        <article data-voy-card>
            <NavLink
                href={groupTourPath(tour.slug)}
                className="group relative block overflow-hidden rounded-[10px]"
            >
                <img
                    src={tour.image}
                    alt={tour.title}
                    loading="lazy"
                    data-voy-img
                    className="h-[clamp(300px,30vw,380px)] w-full object-cover"
                />
                <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.86)] via-[rgb(16_15_12/0.3)] via-48% to-transparent to-80% p-6">
                    <span className="mb-3.5 self-start rounded-full border border-white/55 px-[11px] py-[5px] text-[10.5px] font-bold tracking-[0.16em] uppercase">
                        {tour.region}
                    </span>
                    <p className="mb-3.5 line-clamp-2 text-[15px]/[1.5] text-white/85">
                        {tour.places.join(' · ')}
                    </p>
                    <span className="inline-flex items-center gap-2 border-t border-white/30 pt-3.5 text-sm font-bold tracking-[0.03em]">
                        View trip
                        <ArrowRight className="size-[15px]" aria-hidden="true" />
                    </span>
                </div>
            </NavLink>

            <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-[21px]/[1.2] font-medium tracking-[-0.01em] text-ink">
                    <NavLink
                        href={groupTourPath(tour.slug)}
                        className="transition-colors hover:text-brand"
                    >
                        {tour.title}
                    </NavLink>
                </h3>
                <div className="text-[15px] font-bold whitespace-nowrap text-brand">
                    {tour.price}
                </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-[15px]" strokeWidth={1.7} aria-hidden="true" />
                    {tour.departs}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-[15px]" strokeWidth={1.7} aria-hidden="true" />
                    {tour.duration}
                </span>
            </div>
        </article>
    );
}
