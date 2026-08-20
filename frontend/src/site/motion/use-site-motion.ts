import { useEffect } from 'react';

import { releaseBootCloak } from '@/shared/lib/boot-cloak';

/**
 * Runs the scroll/intro choreography for the current route.
 *
 * The module is reached for with a dynamic `import()` rather than a static one,
 * which keeps GSAP, ScrollTrigger, Lenis and SplitType — comfortably the
 * heaviest thing the marketing site ships — out of the entry bundle. They are
 * decoration: nothing on the page needs them to be readable, usable or correct,
 * so making the first paint wait on them was paying the wrong price. Split out,
 * the browser can paint the hero while the choreography is still arriving.
 *
 * This used to be `useLayoutEffect`, so that the hidden states landed before the
 * browser painted and the page never flashed settled content. That guarantee now
 * comes from CSS instead — `html.voy-boot` hides precisely the elements the
 * timeline animates, from the very first frame — which is what makes deferring
 * the import safe. A plain effect is correct here too: waiting for paint is the
 * point, not something to work around.
 *
 * The fetch is held back one idle turn beyond that. Downloading and starting the
 * choreography is around 140KB of script and a full pass over every section, and
 * doing it while the browser is still settling the first screen competed directly
 * with the hero photograph for the main thread — the picture was decoded and
 * waiting, and the frame that would have shown it went to ScrollTrigger instead.
 * Waiting for idle costs the intro a fraction of a second on a slow device and
 * nothing at all on a quick one, and buys the visitor the picture sooner.
 */
export function useSiteMotion(key: string) {
    useEffect(() => {
        let stop = () => {};
        /* The route may change again before the chunk lands. */
        let cancelled = false;

        const begin = () => {
            if (cancelled) return;

            void import('@/site/motion/motion')
                .then(({ startMotion }) => {
                    if (cancelled) return;
                    stop = startMotion();
                })
                .catch((error) => {
                    /* Motion is decorative: on any failure, hand the page over as-is. */
                    console.error('[voy-motion]', error);
                    releaseBootCloak();
                    document.body.style.removeProperty('opacity');
                });
        };

        /*
         * One frame, not one idle period.
         *
         * Waiting for genuine idle pushed the reveals late enough that the page
         * was still resolving well after it looked finished — every section
         * arriving a beat behind where the design puts it. A single frame is
         * enough to let the first paint through, which was the whole point, and
         * keeps the choreography where it belongs.
         */
        const handle = window.requestAnimationFrame(begin);

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(handle);
            stop();
        };
    }, [key]);
}
