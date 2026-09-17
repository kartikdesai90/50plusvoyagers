import { Check, Plus } from 'lucide-react';

import { SectionHeading } from '@/site/components/section';
import type { TourView } from '@/site/data/tour-view';

type Step = { number: number; body: string };

/**
 * The practical detail, folded away until it is wanted.
 *
 * How to book, the visa note, the documents required and what to know before
 * travelling used to be four full sections between the itinerary and the
 * enquiry form — roughly two thousand pixels of administration sitting where a
 * reader who had just decided needed a way to act. They are all things somebody
 * looks up once, at the point they matter, rather than reads on the way past.
 *
 * `<details>` for the same three reasons the FAQ list gives, and the third is
 * the one that matters most here: the content is in the server-rendered markup
 * even while closed, so nothing is hidden from a crawler or from find-in-page.
 * These pages are being migrated to preserve their rankings, and an accordion
 * that mounted its contents on click would undo exactly that.
 *
 * Nothing is dropped and nothing is reordered — the same four blocks, in the
 * same order, behind four summaries.
 */
export function TourPractical({ tour }: { tour: TourView }) {
    const panels: { title: string; body: React.ReactNode }[] = [];

    if (tour.bookingSteps.length > 0) {
        panels.push({ title: 'How to book', body: <NumberedList items={tour.bookingSteps} /> });
    }

    if (tour.visaHtml) {
        panels.push({
            title: 'Do you need a visa',
            body: (
                <p className="max-w-[68ch] text-[15.5px]/[1.7] whitespace-pre-line text-ink-muted">
                    {tour.visaHtml}
                </p>
            ),
        });
    }

    if (tour.documents.length > 0) {
        panels.push({ title: 'Documents required', body: <NumberedList items={tour.documents} /> });
    }

    if (tour.guidelines.length > 0) {
        panels.push({
            title: 'Before you travel',
            body: (
                <ul className="flex max-w-[68ch] flex-col gap-3.5">
                    {tour.guidelines.map((item) => (
                        <li
                            key={item.number}
                            className="flex items-start gap-[13px] text-[15.5px]/[1.6] text-ink-muted"
                        >
                            <Check
                                className="mt-1 size-[18px] shrink-0 text-brand"
                                strokeWidth={1.7}
                                aria-hidden="true"
                            />
                            {item.body}
                        </li>
                    ))}
                </ul>
            ),
        });
    }

    /*
     * The heading belongs to the component rather than the page.
     *
     * A tour still on the shipped catalogue has none of this — no booking
     * steps, no visa note, no documents — and the page was printing "The
     * practical detail" over nothing at all. Owning the heading is what makes
     * "there is nothing to say" and "say nothing" the same decision.
     */
    if (panels.length === 0) return null;

    return (
        <section className="lg:col-span-2">
            <SectionHeading size="h3" className="mb-6 text-[clamp(26px,3vw,36px)]">
                The *practical* detail
            </SectionHeading>
            <div className="divide-y divide-hairline border-y border-hairline">
                {panels.map((panel) => (
                    <details key={panel.title} className="group py-[22px]">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px]/[1.45] font-semibold text-ink transition-colors marker:content-none hover:text-brand [&::-webkit-details-marker]:hidden">
                            {panel.title}
                            <Plus
                                className="mt-1 size-[18px] shrink-0 text-brand transition-transform duration-300 ease-brand group-open:rotate-45 motion-reduce:transition-none"
                                strokeWidth={1.8}
                                aria-hidden="true"
                            />
                        </summary>
                        <div className="mt-4">{panel.body}</div>
                    </details>
                ))}
            </div>
        </section>
    );
}

/**
 * A numbered list, in the hand the rest of the page uses.
 *
 * The serif ordinal over a brand rule is the homepage's own, so a reader meets
 * a list they already know how to read.
 */
function NumberedList({ items }: { items: Step[] }) {
    return (
        <ol className="flex max-w-[68ch] flex-col gap-4">
            {items.map((item) => (
                <li key={item.number} className="grid grid-cols-[auto_1fr] gap-x-4">
                    <span className="font-serif text-[20px]/none text-brand tabular-nums">
                        {String(item.number).padStart(2, '0')}
                    </span>
                    <p className="text-[15.5px]/[1.6] text-ink-muted">{item.body}</p>
                </li>
            ))}
        </ol>
    );
}
