/**
 * 50+ Voyagers — motion layer.
 *
 * Presentation only. Nothing here changes layout, spacing, typography, colour
 * or responsive behaviour; it only ever touches opacity, transform and
 * object-position. Every animated element has its original `style` attribute
 * stashed beforehand and restored verbatim once its reveal finishes, so the
 * settled page is identical to the page without this file.
 *
 * Motion budget: movement <= 30px, duration 0.6–0.9s, power2/power3 easing,
 * no bounce, rotation, or scaling beyond 1.03.
 *
 * Degrades silently — with `prefers-reduced-motion` the page renders as-is.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import SplitType from 'split-type';

import { releaseBootCloak } from '@/shared/lib/boot-cloak';

/** Every scroll reveal rises by this much, nothing more. */
const RISE = 20;
const DESKTOP_QUERY = '(min-width: 900px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

type Vars = gsap.TweenVars;

/**
 * Exact-restore bookkeeping. Safer than `clearProps`: it hands back author
 * styles untouched, including ones the design relies on.
 */
const stashed = new WeakMap<Element, string | null>();

function stash(els: HTMLElement[]) {
    for (const el of els) {
        if (!stashed.has(el)) stashed.set(el, el.getAttribute('style'));
    }
}

function restore(els: HTMLElement[]) {
    for (const el of els) {
        if (!stashed.has(el)) continue;
        const original = stashed.get(el) ?? null;
        if (original === null) el.removeAttribute('style');
        else el.setAttribute('style', original);
        stashed.delete(el);
    }
}

/**
 * Hidden states are applied with `gsap.set` (never `.from`) so nothing is ever
 * visible for a frame before its own reveal — that is what keeps CLS at zero.
 */
function hide(els: HTMLElement[], vars: Vars) {
    if (!els.length) return els;
    stash(els);
    gsap.set(els, vars);
    return els;
}

function reveal(tl: gsap.core.Timeline, els: HTMLElement[], vars: Vars, position?: number) {
    if (!els.length) return tl;
    tl.to(
        els,
        {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            ...vars,
            onComplete: () => restore(els),
        },
        position,
    );
    return tl;
}

const children = (el: Element) => Array.from(el.children) as HTMLElement[];
const find = <T extends HTMLElement>(sel: string, ctx: ParentNode) => ctx.querySelector<T>(sel);
const findAll = <T extends HTMLElement>(sel: string, ctx: ParentNode) =>
    Array.from(ctx.querySelectorAll<T>(sel));

/**
 * Hover treatment goes only on genuinely card-like items: the card itself never
 * moves, only its image drifts. Pairs with the `[data-voy-card]` CSS.
 */
function tagCard(card: HTMLElement) {
    if (card.hasAttribute('data-voy-card')) return;
    const img = find('img', card);
    if (!img) return;
    card.setAttribute('data-voy-card', '');
    img.setAttribute('data-voy-img', '');
}

export function startMotion(): () => void {
    const cleanups: Array<() => void> = [];
    const hidden: HTMLElement[] = [];

    /*
     * Releasing the first-paint cloak is the one thing that must happen on
     * every code path, success or failure.
     */
    const unboot = releaseBootCloak;

    if (window.matchMedia(REDUCED_QUERY).matches) {
        unboot();
        return () => {};
    }

    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power3.out' });
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* --------------------------------------------------------- smooth scroll */
    const lenis = new Lenis({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
        /*
         * Dialogs and other overflow panes mark themselves with this. Without
         * it, Lenis eats the wheel and the pane cannot scroll — the enquiry
         * modal was the first place that showed.
         */
        prevent: (node) => node.closest('[data-lenis-prevent]') !== null,
    });

    lenis.on('scroll', () => ScrollTrigger.update());
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);

    /* In-page anchors keep their landing position; only the travel is smoothed. */
    const onAnchorClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest?.('a[href^="#"]');
        const href = anchor?.getAttribute('href');
        if (!href || href === '#') return;

        let destination: Element | null = null;
        try {
            destination = document.querySelector(href);
        } catch {
            return;
        }
        if (!destination) return;

        event.preventDefault();
        lenis.scrollTo(destination as HTMLElement, { offset: 0, duration: 1.4 });
    };

    document.addEventListener('click', onAnchorClick);

    /*
     * Pause the page scroller while a dialog is open. `prevent` still lets the
     * pane itself scroll; `stop` is what stops the page behind it from moving
     * when the wheel is over the overlay.
     */
    const onOverlay = (event: Event) => {
        const open = (event as CustomEvent<boolean>).detail;

        if (open) lenis.stop();
        else lenis.start();
    };

    window.addEventListener('voy:overlay', onOverlay);

    cleanups.push(() => {
        document.removeEventListener('click', onAnchorClick);
        window.removeEventListener('voy:overlay', onOverlay);
        gsap.ticker.remove(raf);
        lenis.destroy();
    });

    /*
     * Each section reveals exactly once. ScrollTrigger drives it and an
     * IntersectionObserver backstops it: a fast scroll could otherwise retire a
     * trigger before its timeline played, stranding that block at opacity 0.
     */
    const played = new WeakSet<Element>();
    const timelines = new WeakMap<Element, gsap.core.Timeline>();
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                observer.unobserve(entry.target);
                if (played.has(entry.target)) continue;
                played.add(entry.target);
                timelines.get(entry.target)?.play();
            }
        },
        { rootMargin: '0px 0px -14% 0px' },
    );
    cleanups.push(() => observer.disconnect());

    function trigger(el: HTMLElement, tl: gsap.core.Timeline) {
        timelines.set(el, tl);
        ScrollTrigger.create({
            trigger: el,
            start: 'top 86%',
            once: true,
            animation: tl,
            onEnter: () => played.add(el),
        });
        observer.observe(el);
        cleanups.push(() => {
            tl.kill();
        });
    }

    /* ------------------------------------------------------------- parallax */
    /*
     * `object-position` rather than transform: it cannot collide with the hover
     * scale on the very same images, and crops nothing new — at the section's
     * midpoint the framing is exactly the original 50% 50%.
     */
    function parallax(img: HTMLElement, range: number) {
        const set = gsap.quickSetter(img, 'objectPosition') as (value: string) => void;
        ScrollTrigger.create({
            trigger: img.parentElement ?? img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                set(`50% ${(50 + (self.progress - 0.5) * range * 2).toFixed(2)}%`);
            },
        });
    }

    /* ------------------------------------------------------ choreography */

    function buildHero(hero: HTMLElement) {
        const copy = hero.firstElementChild;
        const h1 = find('h1', hero);
        const paragraphs = findAll<HTMLParagraphElement>('p', copy ?? hero);
        const [eyebrow, subtitle] = paragraphs;
        const ctas = copy ? findAll<HTMLAnchorElement>('a', copy) : [];

        if (eyebrow) hidden.push(...hide([eyebrow], { opacity: 0, y: 16 }));
        if (subtitle) hidden.push(...hide([subtitle], { opacity: 0, y: 20 }));
        if (ctas.length) hidden.push(...hide(ctas, { opacity: 0, y: 14 }));
        if (h1) hidden.push(...hide([h1], { opacity: 0 }));

        /*
         * Wait for webfonts before splitting so the line boxes SplitType
         * measures are the real ones. The split is reverted the instant it has
         * served its purpose, restoring the original markup and its balance.
         */
        const fontsReady: Promise<unknown> =
            typeof document.fonts?.ready?.then === 'function'
                ? Promise.race([
                      document.fonts.ready,
                      new Promise((resolve) => setTimeout(resolve, 1200)),
                  ])
                : Promise.resolve();

        void fontsReady.then(() => {
            let split: SplitType | null = null;
            let lines: HTMLElement[] | null = null;

            if (h1) {
                try {
                    split = new SplitType(h1, { types: 'lines' });
                    lines = split.lines;
                } catch {
                    split = null;
                    lines = null;
                }
            }

            const tl = gsap.timeline();

            /*
             * No page-wide fade any more — the document is never held at zero
             * opacity, so there is nothing to fade back. The hero's own copy
             * still arrives exactly as it did, on the same offsets.
             */
            if (eyebrow) reveal(tl, [eyebrow], { y: 0, duration: 0.7 }, 0.12);

            if (h1 && lines?.length) {
                gsap.set(h1, { opacity: 1 });
                gsap.set(lines, { opacity: 0, yPercent: 28 });
                tl.to(
                    lines,
                    {
                        opacity: 1,
                        yPercent: 0,
                        duration: 0.9,
                        stagger: 0.1,
                        ease: 'power3.out',
                        onComplete: () => {
                            split?.revert();
                            restore([h1]);
                            ScrollTrigger.refresh();
                        },
                    },
                    0.24,
                );
            } else if (h1) {
                gsap.set(h1, { y: 22 });
                reveal(tl, [h1], { y: 0, duration: 0.9, ease: 'power3.out' }, 0.24);
            }

            if (subtitle) reveal(tl, [subtitle], { y: 0, duration: 0.8 }, 0.55);
            if (ctas.length) reveal(tl, ctas, { y: 0, duration: 0.7, stagger: 0.09 }, 0.72);

            cleanups.push(() => {
                tl.kill();
            });
        });
    }

    /** Full-bleed image CTA band: the photo fades in, then its copy rises. */
    function buildDivider(el: HTMLElement, tl: gsap.core.Timeline, at: number) {
        const img = find('img', el);
        const body = find('.voy-divider-body', el);
        const parts = body ? children(body) : [];

        if (img) {
            hidden.push(...hide([img], { opacity: 0 }));
            reveal(tl, [img], { duration: 0.9, ease: 'power2.out' }, at);
        }
        if (parts.length) {
            hidden.push(...hide(parts, { opacity: 0, y: RISE }));
            reveal(tl, parts, { y: 0, duration: 0.8, stagger: 0.1 }, at + 0.22);
        }
    }

    /** A grid or wrapped row of cards: staggered fade-up. */
    function buildGroup(container: HTMLElement, tl: gsap.core.Timeline, at: number) {
        const items = children(container);
        if (!items.length) return;

        items.forEach(tagCard);
        hidden.push(...hide(items, { opacity: 0, y: RISE }));
        reveal(tl, items, { y: 0, duration: 0.8, stagger: 0.1 }, at);
    }

    /*
     * One vocabulary everywhere: fade + 20px rise. Headings lead, body copy
     * follows, buttons land last — the order comes from source order plus the
     * 0.12s cadence, so no section needs a bespoke rule.
     */
    function buildSection(section: HTMLElement) {
        const inner = find(':scope > div', section) ?? section;
        const blocks = children(inner);
        if (!blocks.length) return;

        const tl = gsap.timeline({ paused: true });
        let at = 0;

        for (const block of blocks) {
            if (block.classList.contains('voy-divider')) {
                buildDivider(block, tl, at);
                at += 0.1;
            } else if (block.hasAttribute('data-voy-group')) {
                buildGroup(block, tl, at);
                at += 0.2;
            } else {
                hidden.push(...hide([block], { opacity: 0, y: RISE }));
                reveal(tl, [block], { y: 0, duration: 0.8 }, at);
                at += 0.12;
            }
        }

        trigger(section, tl);
    }

    function buildFooter(footer: HTMLElement) {
        const inner = find(':scope > div', footer) ?? footer;
        const blocks = children(inner);
        if (!blocks.length) return;

        hidden.push(...hide(blocks, { opacity: 0, y: RISE }));
        const tl = gsap.timeline({ paused: true });
        reveal(tl, blocks, { y: 0, duration: 0.8, stagger: 0.1 });
        trigger(footer, tl);
    }

    /* ------------------------------------------------------------------ boot */

    const sections = findAll<HTMLElement>('main section', document);
    const footer = find<HTMLElement>('footer', document);

    if (!sections.length) {
        cleanups.forEach((fn) => fn());
        unboot();
        return () => {};
    }

    /*
     * The whole document used to be held at `opacity: 0` here and faded back in
     * by the hero timeline. It was the flash guard, but it guarded far more than
     * it needed to: the hero photograph is never animated by the intro, and
     * holding it invisible until GSAP had booted and the webfonts had resolved
     * made the bundle's start-up cost the page's Largest Contentful Paint —
     * around five seconds of blank page on a throttled connection, because LCP
     * does not count anything painted at zero opacity.
     *
     * The guard now lives in CSS, on `html.voy-boot`, and names precisely the
     * elements the three `build*` functions hide a few lines below. Each of them
     * still starts hidden and still arrives on its own schedule, so the
     * choreography is untouched; the photograph and the header simply paint as
     * soon as they arrive instead of queueing behind a script.
     */
    buildHero(sections[0]);
    sections.slice(1).forEach(buildSection);
    if (footer) buildFooter(footer);
    unboot();

    /*
     * Subtle parallax on the large editorial banners only, where it reads as
     * depth rather than drift. Desktop-only: cheaper, kinder to touch devices.
     * The hero image is excluded — it sits under the centred hero copy, so any
     * framing drift there reads as the hero being out of alignment.
     */
    if (window.matchMedia(DESKTOP_QUERY).matches) {
        findAll<HTMLImageElement>('.voy-divider img', document).forEach((img) => parallax(img, 5));
    }

    /* Late-loading imagery shifts trigger positions. */
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    cleanups.push(() => window.removeEventListener('load', onLoad));

    ScrollTrigger.refresh();

    return () => {
        cleanups.forEach((fn) => fn());
        ScrollTrigger.getAll().forEach((instance) => instance.kill());
        /* Hand back anything still waiting for a reveal that will now never run. */
        restore(hidden);
        gsap.set(document.body, { clearProps: 'opacity' });
    };
}
