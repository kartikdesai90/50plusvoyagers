import type { Tour, TourInput } from '@/admin/features/tours/types';

/** What the form starts as when a tour is being added. */
export const blankTour: TourInput = {
    tour_code: '',
    tour_name: '',
    end_date: '',
};

/** An existing tour, in the shape the form edits. */
export function toInput(tour: Tour): TourInput {
    return {
        tour_code: tour.tour_code,
        tour_name: tour.tour_name,
        end_date: tour.end_date ?? '',
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
