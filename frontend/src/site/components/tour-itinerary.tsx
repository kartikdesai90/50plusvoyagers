import { CalendarDays, ChevronDown, Hotel, UtensilsCrossed } from 'lucide-react';

import type { TourView } from '@/site/data/tour-view';

type Day = TourView['itinerary'][number];

/**
 * The day-by-day, as a list of disclosures.
 *
 * Thirteen days written out in full is roughly four thousand words, and the
 * page printed all of it at once: a visitor could not see the shape of the trip
 * — where it goes, how long in each place — without reading the whole thing.
 *
 * `<details>` rather than a scripted accordion, for the same three reasons the
 * FAQ list gives — it works without JavaScript, it is keyboard-operable and
 * announced correctly with no ARIA, and its contents are in the server-rendered
 * markup even while closed. That last one is load-bearing rather than merely
 * nice: these pages already rank on their itinerary prose, and an accordion
 * that mounted its content on click would hide all thirteen days from a
 * crawler.
 *
 * The rail carries the sequence, the number is set against it, and the three
 * facts a reader compares across days — the date, the hotel, the meals — stay
 * on the closed row so the list answers them at a glance rather than after
 * thirteen clicks.
 */
export function TourItinerary({ days }: { days: Day[] }) {
    if (days.length === 0) return null;

    return (
        <ol className="relative flex flex-col">
            {/*
             * The thread the days hang from.
             *
             * Inset to sit under the centre of the markers and stopped short at
             * both ends, so it reads as a route between the first day and the
             * last rather than a border running off the section.
             */}
            <span
                aria-hidden="true"
                className="absolute top-8 bottom-8 left-[21px] w-px bg-hairline"
            />

            {days.map((day, index) => {
                const first = index === 0;
                const last = index === days.length - 1;

                return (
                    <li key={day.day} className="relative">
                        <details className="group" open={first}>
                            <summary className="flex cursor-pointer list-none items-start gap-4 py-5 marker:content-none [&::-webkit-details-marker]:hidden">
                                {/*
                                 * The marker. Filled on the first and last day
                                 * because arriving and leaving are different in
                                 * kind from the days between them — a reader
                                 * scanning for "when does it end" finds it
                                 * without counting.
                                 */}
                                <span
                                    className={[
                                        'relative z-10 mt-0.5 flex size-[42px] shrink-0 items-center justify-center rounded-full border text-[15px] tabular-nums transition-colors',
                                        first || last
                                            ? 'border-brand bg-brand font-bold text-white'
                                            : 'border-hairline bg-surface-alt font-bold text-ink group-hover:border-brand group-hover:text-brand',
                                    ].join(' ')}
                                >
                                    {String(day.day).padStart(2, '0')}
                                </span>

                                <span className="min-w-0 flex-1 pt-1.5">
                                    <span className="block text-[17.5px]/[1.35] font-semibold tracking-[-0.005em] text-ink transition-colors group-hover:text-brand">
                                        {day.title}
                                    </span>

                                    {/*
                                     * Kept on the closed row rather than inside
                                     * it. These are the three things a reader
                                     * compares across days — when is it, where
                                     * am I sleeping, what is included — and
                                     * burying them behind a click would mean
                                     * opening all thirteen to answer a question
                                     * the list should answer at a glance.
                                     *
                                     * Separated by their own rules rather than
                                     * run together, so three facts read as
                                     * three rather than as one long line.
                                     */}
                                    {day.date || day.stay || day.meals ? (
                                        <span className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-ink-muted">
                                            {day.date ? (
                                                <Fact icon={CalendarDays} value={day.date} />
                                            ) : null}
                                            {day.stay ? (
                                                <Fact icon={Hotel} value={day.stay} divided />
                                            ) : null}
                                            {day.meals ? (
                                                <Fact
                                                    icon={UtensilsCrossed}
                                                    value={day.meals}
                                                    divided
                                                />
                                            ) : null}
                                        </span>
                                    ) : null}
                                </span>

                                <span className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors group-hover:bg-surface-alt group-hover:text-brand">
                                    <ChevronDown
                                        className="size-[18px] transition-transform duration-300 ease-brand group-open:rotate-180 motion-reduce:transition-none"
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                    />
                                </span>
                            </summary>

                            {/*
                             * Indented past the rail so the prose lines up with
                             * the title above it rather than with the marker.
                             * `whitespace-pre-line` because the importer joins
                             * the original paragraphs with blank lines.
                             */}
                            <div className="pb-6 pl-[58px]">
                                <p className="max-w-[66ch] text-[15.5px]/[1.75] whitespace-pre-line text-ink-muted">
                                    {day.body}
                                </p>
                            </div>
                        </details>

                        {/* Between days only — the list closes on its own rule. */}
                        {!last ? (
                            <span
                                aria-hidden="true"
                                className="ml-[58px] block h-px bg-hairline/70"
                            />
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}

/**
 * One fact on a closed row.
 *
 * The divider is drawn before the chip rather than after, so the row never ends
 * on a rule when a day has no meals listed.
 */
function Fact({
    icon: Icon,
    value,
    divided = false,
}: {
    icon: typeof CalendarDays;
    value: string;
    divided?: boolean;
}) {
    return (
        <span className="inline-flex items-center gap-2">
            {divided ? (
                <span aria-hidden="true" className="hidden h-3 w-px bg-hairline sm:block" />
            ) : null}
            <span className="inline-flex items-center gap-1.5">
                <Icon
                    className="size-[14px] shrink-0 opacity-70"
                    strokeWidth={1.7}
                    aria-hidden="true"
                />
                {value}
            </span>
        </span>
    );
}
