'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';

import { Button } from '@/shared/ui/button';
import { NavLink } from '@/site/components/nav-link';
import { paths } from '@/routes/paths';
import { siteConfig } from '@/site/config/site';

const navLinkClass = 'text-ink transition-colors hover:text-brand';

/** Marks the entry whose page the visitor is currently reading. */
function isCurrent(href: string, pathname: string): boolean {
    const [path] = href.split('#');

    if (path === '' || path === '/') return pathname === '/';

    return pathname === path || pathname.startsWith(`${path}/`);
}

/** Anchors resolve against the homepage so the header works from any route. */
function Wordmark({ className, name }: { className?: string; name: string }) {
    return (
        <Link href={paths.home} className={className} aria-label={`${name} — home`}>
            <span className="flex size-10 items-center justify-center rounded-full bg-brand font-serif text-sm font-semibold text-white">
                50+
            </span>
            <span className="font-serif text-[clamp(19px,5vw,23px)] font-semibold tracking-[-0.01em] text-ink">
                Voyagers
            </span>
        </Link>
    );
}

/**
 * The site header.
 *
 * Contact details and menus come from one configuration module, so the header
 * and the footer cannot drift apart on what the business is called or how to
 * reach it.
 */
export function SiteHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const { name, phone, phoneHref, navLeft, navRight } = siteConfig;
    const allNav = [...navLeft, ...navRight];

    /*
     * The page behind the sheet does not scroll.
     *
     * Without this a swipe over a full-screen menu moves the page underneath
     * it, so closing the menu leaves the visitor somewhere they never chose to
     * be. `overscroll-contain` on the sheet stops the scroll chaining once the
     * list itself has been scrolled to its end; this stops it starting.
     */
    useEffect(() => {
        if (!isMenuOpen) return;

        const { overflow } = document.body.style;

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = overflow;
        };
    }, [isMenuOpen]);

    /* Escape closes it, as it closes every other layer on the web. */
    useEffect(() => {
        if (!isMenuOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsMenuOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isMenuOpen]);

    /* Both desktop halves and the mobile drawer render an entry the same way. */
    const navProps = (href: string) => ({
        href,
        className: cn(navLinkClass, isCurrent(href, pathname) && 'text-brand'),
        'aria-current': isCurrent(href, pathname) ? ('page' as const) : undefined,
    });

    return (
        <header className="sticky top-0 z-50 border-b border-hairline bg-surface/90 backdrop-blur-[10px]">
            <div className="border-b border-hairline">
                <div className="voy-container flex flex-wrap items-center justify-center gap-x-[clamp(14px,3vw,30px)] gap-y-1.5 py-[7px] sm:justify-end">
                    <a
                        href={phoneHref}
                        className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.02em] text-ink transition-colors hover:text-brand"
                    >
                        <Phone className="size-[15px]" aria-hidden="true" />
                        {phone}
                    </a>
                    <Link
                        href={paths.membership}
                        className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.02em] text-brand transition-colors hover:text-brand-deep"
                    >
                        <User className="size-[15px]" aria-hidden="true" />
                        Log In / Register
                    </Link>
                </div>
            </div>

            <div className="voy-container flex h-[76px] items-center justify-between gap-3 sm:gap-5 lg:grid lg:grid-cols-[1fr_auto_1fr]">
                <nav className="hidden items-center gap-[30px] text-xs font-bold tracking-[0.14em] uppercase lg:flex">
                    {navLeft.map((item) => (
                        <NavLink key={item.label} {...navProps(item.href)}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <Wordmark
                    name={name}
                    className="flex items-center gap-[11px] lg:justify-self-center"
                />

                <nav className="hidden items-center justify-end gap-[30px] text-xs font-bold tracking-[0.14em] uppercase lg:flex">
                    {navRight.map((item) => (
                        <NavLink key={item.label} {...navProps(item.href)}>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-2 lg:hidden"
                    aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
                    aria-expanded={isMenuOpen}
                    aria-controls="site-menu"
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    {/*
                     * Both marks are drawn, stacked, and cross-faded. Swapping
                     * one element for the other cannot be animated — there is
                     * nothing shared between them to interpolate — and the
                     * button is the one control on the screen while the sheet
                     * is open, so it should turn rather than blink.
                     */}
                    <span className="relative block size-5">
                        <Menu
                            aria-hidden="true"
                            className={cn(
                                'absolute inset-0 size-5 transition-[opacity,transform] duration-300 ease-brand motion-reduce:transition-none',
                                isMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
                            )}
                        />
                        <X
                            aria-hidden="true"
                            className={cn(
                                'absolute inset-0 size-5 transition-[opacity,transform] duration-300 ease-brand motion-reduce:transition-none',
                                isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0',
                            )}
                        />
                    </span>
                </Button>
            </div>

            {/*
             * The menu, as a sheet over the whole page.
             *
             * It used to be a panel that pushed the page down, which left the
             * hero and the trip cards visible underneath it — so the menu read
             * as part of the page rather than as something on top of it, and
             * the eye had two things competing for it at once.
             *
             * Always mounted, shown and hidden by class rather than by being
             * added to and removed from the tree. A sheet that only exists
             * while it is open can animate its way in but never out — React
             * takes the node away the moment the state flips, and the closing
             * transition has nothing left to run on. Kept mounted, both
             * directions animate.
             *
             * `absolute` rather than `fixed`, and `top-full` rather than a
             * measured offset: the header is the containing block, so the sheet
             * hangs off its own bottom edge and lines up with the rule under
             * the bar however tall that bar happens to be. The utility strip
             * wraps to two rows on the narrowest phones, and anything measured
             * in pixels would part company with the header exactly there.
             *
             * `100dvh` rather than `100vh` for the height: on a phone the
             * dynamic unit accounts for the browser's own chrome sliding in and
             * out, so the sheet ends at the bottom of what is actually on
             * screen rather than behind the address bar.
             */}
            <nav
                id="site-menu"
                aria-label="Site"
                aria-hidden={!isMenuOpen}
                className={cn(
                    /*
                     * A column, so the sheet's own height is shared out rather
                     * than left over. The list takes what it needs at the top
                     * and the contact block is pushed to the foot; without this
                     * both sat at the top and the remaining height showed as a
                     * band of empty surface hanging under them.
                     */
                    'absolute inset-x-0 top-full flex h-[calc(100dvh-100%)] origin-top flex-col overflow-y-auto overscroll-contain border-t border-hairline bg-surface lg:hidden',
                    /*
                     * Fade and a short rise together. The distance is small on
                     * purpose — a full-height sheet travelling far reads as a
                     * page change rather than as a menu, and on a phone the
                     * longer journey is the thing that feels slow.
                     */
                    'transition-[opacity,transform,visibility] duration-300 ease-brand',
                    'motion-reduce:transition-none',
                    isMenuOpen
                        ? 'visible translate-y-0 opacity-100'
                        : /*
                           * `invisible` rather than `hidden`, and delayed until
                           * the fade has finished: `display` cannot be
                           * transitioned, so hiding outright would cut the
                           * closing animation off at the first frame. This also
                           * takes the closed sheet out of the tab order, which
                           * `opacity: 0` alone does not.
                           */
                          'invisible -translate-y-2 opacity-0 transition-[opacity,transform,visibility] delay-0',
                )}
            >
                <ul className="voy-container flex shrink-0 flex-col py-2">
                    {allNav.map((item) => (
                        <li key={item.label}>
                            <NavLink
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                tabIndex={isMenuOpen ? undefined : -1}
                                aria-current={isCurrent(item.href, pathname) ? 'page' : undefined}
                                className={cn(
                                    /*
                                     * Taller rows and larger type than the
                                     * desktop bar. This is a list read at arm's
                                     * length and tapped with a thumb by people
                                     * over fifty, so every row clears the 44px
                                     * touch target and the hairline between them
                                     * makes the rows countable rather than a
                                     * block of capitals.
                                     */
                                    'block border-b border-hairline py-[18px] text-[13px] font-bold tracking-[0.14em] uppercase transition-colors last:border-b-0 hover:text-brand',
                                    isCurrent(item.href, pathname) ? 'text-brand' : 'text-ink',
                                )}
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/*
                 * The two things the utility strip carries, repeated at the
                 * foot of the sheet. A menu that fills the screen has room for
                 * them, and a thumb reaching the bottom of a phone finds them
                 * more easily than the strip at the very top.
                 */}
                <div className="voy-container mt-auto flex flex-col gap-4 border-t border-hairline py-7">
                    <a
                        href={phoneHref}
                        onClick={() => setIsMenuOpen(false)}
                        tabIndex={isMenuOpen ? undefined : -1}
                        className="inline-flex items-center gap-2.5 text-[15px] font-bold text-ink transition-colors hover:text-brand"
                    >
                        <Phone className="size-[17px]" aria-hidden="true" />
                        {phone}
                    </a>
                    <Link
                        href={paths.membership}
                        onClick={() => setIsMenuOpen(false)}
                        tabIndex={isMenuOpen ? undefined : -1}
                        className="inline-flex items-center gap-2.5 text-[15px] font-bold text-brand transition-colors hover:text-brand-deep"
                    >
                        <User className="size-[17px]" aria-hidden="true" />
                        Log In / Register
                    </Link>
                </div>
            </nav>
        </header>
    );
}
