'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * The ask, kept within reach after the booking panel has gone.
 *
 * The panel beside the price sticks only within its own section, and that
 * section ends before the itinerary begins — so for the longest part of the
 * page, and everything after it, there was nothing on screen to act on. A
 * reader who decided at day nine had to scroll back up to find out how.
 *
 * It appears only once the panel is actually off screen, so the two are never
 * both asking at the same time. Enquire opens the same modal the other
 * buttons use, rather than scrolling to a form that is no longer on the page.
 */
export function TourBookBar({
    price,
    title,
    hidden = false,
    onEnquire,
}: {
    price: string | null;
    title: string;
    /** True while the enquiry dialog is open, so the bar cannot sit over it. */
    hidden?: boolean;
    onEnquire: () => void;
}) {
    const [shown, setShown] = useState(false);
    const sentinel = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const panel = document.getElementById('tour-panel');

        if (!panel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    /* Past it, not merely off the top of a short viewport. */
                    setShown(!entry.isIntersecting && entry.boundingClientRect.top < 0);
                }
            },
            { rootMargin: '0px 0px -20% 0px' },
        );

        observer.observe(panel);

        return () => observer.disconnect();
    }, []);

    const visible = shown && !hidden;

    return (
        <div ref={sentinel} aria-hidden={!visible}>
            <div
                className={[
                    'fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 backdrop-blur-sm transition-transform duration-300 ease-brand motion-reduce:transition-none',
                    visible ? 'translate-y-0' : 'translate-y-full',
                ].join(' ')}
            >
                <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-[clamp(18px,4vw,32px)] py-3">
                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-ink">{title}</p>
                        {price ? (
                            <p className="text-[13px] text-ink-muted">
                                From <span className="font-semibold text-ink">{price}</span> per
                                person
                            </p>
                        ) : (
                            <p className="text-[13px] text-ink-muted">Dates on request</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onEnquire}
                        tabIndex={visible ? undefined : -1}
                        className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14px] font-bold tracking-[0.02em] text-white transition-opacity hover:opacity-90"
                    >
                        Enquire
                        <ArrowRight className="size-[15px]" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
