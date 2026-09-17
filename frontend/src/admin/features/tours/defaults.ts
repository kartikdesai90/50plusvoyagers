import type { Tour, TourInput } from '@/admin/features/tours/types';

/** What the form starts as when a tour is being added. */
export const blankTour: TourInput = {
    tour_code: '',
    tour_name: '',
    end_date: '',

    slug: '',
    legacy_url: '',
    page_title: '',
    subtitle: '',
    region: '',
    summary: '',
    ribbon_text: '',
    visa_content: '',
    booking_fee: '',
    balance_due_days: '',

    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    canonical_url: '',

    status: 'draft',
    display_order: '0',
};

/** An existing tour, in the shape the form edits. */
export function toInput(tour: Tour): TourInput {
    return {
        tour_code: tour.tour_code,
        tour_name: tour.tour_name,
        end_date: tour.end_date ?? '',

        slug: tour.slug ?? '',
        legacy_url: tour.legacy_url ?? '',
        page_title: tour.page_title ?? '',
        subtitle: tour.subtitle ?? '',
        region: tour.region ?? '',
        summary: tour.summary ?? '',
        ribbon_text: tour.ribbon_text ?? '',
        visa_content: tour.visa_content ?? '',
        booking_fee: tour.booking_fee === null ? '' : String(tour.booking_fee),
        balance_due_days: tour.balance_due_days === null ? '' : String(tour.balance_due_days),

        meta_title: tour.meta_title ?? '',
        meta_description: tour.meta_description ?? '',
        meta_keywords: tour.meta_keywords ?? '',
        og_title: tour.og_title ?? '',
        og_description: tour.og_description ?? '',
        canonical_url: tour.canonical_url ?? '',

        status: tour.status,
        display_order: String(tour.display_order),
    };
}

/**
 * How much of a tour's page has been written.
 *
 * The list screen shows this so an editor can see at a glance which tours are
 * still only CRM records — with thirty-two pages to migrate, that is the
 * question they are actually asking when they open the list.
 */
export function pageProgress(tour: Tour): { written: boolean; summary: string } {
    const counts = tour.counts;

    if (!counts) return { written: Boolean(tour.slug), summary: '' };

    const parts = [
        counts.itinerary_days ? `${counts.itinerary_days} days` : null,
        counts.highlights ? `${counts.highlights} highlights` : null,
        counts.images ? `${counts.images} images` : null,
        counts.inclusions ? `${counts.inclusions} inclusions` : null,
    ].filter(Boolean);

    return {
        written: parts.length > 0,
        summary: parts.length > 0 ? parts.join(' · ') : 'No page content yet',
    };
}

/**
 * A stored date as a reader expects to see it.
 *
 * Built from the parts rather than `toLocaleDateString` on a parsed string:
 * `new Date('2026-06-02')` is midnight UTC, which in a timezone behind it is
 * still the 1st. A tour would then show as ending a day early for anyone west
 * of Greenwich.
 */
export function formatEndDate(value: string | null): string {
    if (!value) return '—';

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return value;

    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    return `${day} ${months[month - 1]} ${year}`;
}
