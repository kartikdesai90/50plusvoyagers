'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * The ask, kept within reach after the booking panel has gone.
 *
 * The panel beside the price sticks only within its own section, and that
 * section ends before the itinerary begins — so for the longest part of the
 * page, and everything after it, there was nothing on screen to act on. A
 * reader who decided at day nine had to scroll back up or all the way down to
 * find out how.
 *
 * It appears only once the panel is actually off screen, so the two are never
 * both asking at the same time, and it hides again at the enquiry form: a bar
 * urging you to enquire, pinned over the form you are already filling in, is
 * noise.
 *
 * Desktop keeps the panel in view for longer, so this is a phone-and-tablet
 * concern first — but it is shown at every width, because a long page is long
 * on a laptop too.
 */
export function TourBookBar({ price, title }: { price: string | null; title: string }) {
    const [shown, setShown] = useState(false);
    const sentinel = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const panel = document.getElementById('tour-panel');
        const form = document.getElementById('enquire');

        if (!panel || !form) return;

        /*
         * Two things decide it: the panel is past, and the form is not yet
         * here. Tracked with one observer over both, rather than a scroll
         * handler, so nothing runs on the main thread between the two moments
         * that matter.
         */
        let panelGone = false;
        let formHere = false;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.target === panel) {
                        /* Past it, not merely off the top of a short viewport. */
                        panelGone = !entry.isIntersecting && entry.boundingClientRect.top < 0;
                    }

                    if (entry.target === form) {
                        formHere = entry.isIntersecting;
                    }
                }

                setShown(panelGone && !formHere);
            },
            { rootMargin: '0px 0px -20% 0px' },
        );

        observer.observe(panel);
        observer.observe(form);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={sentinel} aria-hidden={!shown}>
            <div
                className={[
                    'fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 backdrop-blur-sm transition-transform duration-300 ease-brand motion-reduce:transition-none',
                    shown ? 'translate-y-0' : 'translate-y-full',
                ].join(' ')}
            >
                <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-[clamp(18px,4vw,32px)] py-3">
                    <div className="min-w-0">
                        {/*
                         * The name is what tells a reader which trip the bar is
                         * about — on a page this long they may have arrived
                         * from a listing of several. Truncated rather than
                         * wrapped so the bar keeps one height.
                         */}
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

                    <a
                        href="#enquire"
                        /*
                         * Taken out of the tab order while hidden. A link that
                         * is off screen but still focusable sends a keyboard
                         * user somewhere they cannot see.
                         */
                        tabIndex={shown ? undefined : -1}
                        className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14px] font-bold tracking-[0.02em] text-white transition-opacity hover:opacity-90"
                    >
                        Enquire
                        <ArrowRight className="size-[15px]" aria-hidden="true" />
                    </a>
                </div>
            </div>
        </div>
    );
}
