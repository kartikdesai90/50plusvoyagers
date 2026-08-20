import { Plus } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export type Faq = { question: string; answer: string };

/**
 * Questions and answers, as native disclosures.
 *
 * `<details>` rather than a scripted accordion, deliberately: it opens with
 * JavaScript disabled, it is keyboard-operable and announced correctly without
 * a single ARIA attribute, and — the reason that matters most here — its
 * contents are in the server-rendered markup, so an answer is findable by
 * search and by the browser's own find-in-page even while collapsed.
 */
export function FaqList({ items, className }: { items: Faq[]; className?: string }) {
    return (
        <div className={cn('divide-y divide-hairline border-y border-hairline', className)}>
            {items.map((faq) => (
                <details key={faq.question} className="group py-[22px]">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px]/[1.45] font-semibold text-ink transition-colors marker:content-none hover:text-brand [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <Plus
                            className="mt-1 size-[18px] shrink-0 text-brand transition-transform duration-300 ease-brand group-open:rotate-45 motion-reduce:transition-none"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        />
                    </summary>
                    <p className="mt-3.5 max-w-[68ch] text-[15.5px]/[1.65] text-ink-muted">
                        {faq.answer}
                    </p>
                </details>
            ))}
        </div>
    );
}
