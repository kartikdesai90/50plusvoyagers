import { useCallback, useEffect, useRef, useState } from 'react';

const AUTOPLAY_MS = 6500;

/**
 * Auto-advancing index with manual stepping. Autoplay pauses while the tab is
 * hidden, restarts whenever the user steps, and is skipped entirely when the
 * visitor prefers reduced motion.
 */
export function useHeroSlider(count: number) {
    const [index, setIndex] = useState(0);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    const [autoplay, setAutoplay] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setAutoplay(!query.matches && count > 1);

        sync();
        query.addEventListener('change', sync);

        return () => query.removeEventListener('change', sync);
    }, [count]);

    const goTo = useCallback((next: number) => setIndex((next + count) % count), [count]);

    const step = useCallback(
        (delta: number) => setIndex((i) => (i + delta + count) % count),
        [count],
    );

    useEffect(() => {
        if (!autoplay) return;

        timer.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                setIndex((i) => (i + 1) % count);
            }
        }, AUTOPLAY_MS);

        return () => {
            if (timer.current) clearInterval(timer.current);
        };
        /* `index` restarts the countdown after a manual step, matching the reference. */
    }, [autoplay, count, index]);

    return { index, goTo, step };
}
