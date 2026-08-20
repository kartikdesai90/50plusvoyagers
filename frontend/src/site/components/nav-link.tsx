'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';

/*
 * Spelled out rather than extending `ComponentProps<'a'>`, as it always was.
 * The reason has changed but the conclusion has not: the two branches below
 * render different elements, and the prop set that means the same thing to
 * both is this one. These are the props navigation actually passes.
 */
type NavLinkProps = {
    href: string;
    children?: React.ReactNode;
    className?: string;
    id?: string;
    'aria-label'?: string;
    'aria-current'?: React.AriaAttributes['aria-current'];
    onClick?: (event: React.MouseEvent<Element>) => void;
    /**
     * `-1` on links inside a closed layer.
     *
     * A menu that is hidden by opacity rather than by `display` is still in the
     * tab order, so without this a visitor tabbing through the header walks
     * into six links they cannot see.
     */
    tabIndex?: number;
};

/** `tel:`, `mailto:` and absolute URLs are never a client-side navigation. */
function isExternal(href: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

/**
 * One link that knows how it should travel.
 *
 * The chrome is written once and used on every page, so it cannot know in
 * advance whether a given entry is another route, a section of the page the
 * visitor is already on, or an address outside the site. This resolves that at
 * render time:
 *
 *   - an off-site or protocol href is a plain anchor;
 *   - a `#section` on the current path is a plain anchor, so it scrolls rather
 *     than re-fetching the page the visitor is already looking at;
 *   - anything else is a client-side navigation.
 *
 * Written this way, `siteConfig` stays a list of addresses and none of the
 * navigation components have to care about the transport.
 */
export function NavLink({ href, children, ...props }: NavLinkProps) {
    const currentPath = usePathname();

    if (isExternal(href)) {
        const offSite = /^https?:/i.test(href);

        return (
            <a
                href={href}
                {...(offSite ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                {...props}
            >
                {children}
            </a>
        );
    }

    const [path, hash] = href.split('#');
    const normalised = path === '' ? '/' : path.replace(/(.)\/$/, '$1');

    if (hash && normalised === currentPath) {
        return (
            <a href={`#${hash}`} {...props}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} {...props}>
            {children}
        </Link>
    );
}
