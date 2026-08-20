'use client';

import NextLink from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, type ComponentProps, type ReactNode } from 'react';

/**
 * The router API the admin panel was written against, backed by Next.
 *
 * The panel used React Router, which is not something the App Router can host.
 * Rather than rewrite twenty-eight screens — and risk changing behaviour in
 * each one while claiming not to — the four things those screens actually use
 * are re-implemented here on top of `next/navigation`, with the same names and
 * the same call signatures. The screens keep their one-line import change and
 * nothing else.
 *
 * What is deliberately *not* reproduced is anything the panel never used:
 * loaders, actions, nested route objects, relative resolution. This is a shim
 * for a known set of call sites, not a second router.
 */

/* ------------------------------------------------------------- navigation state */

/**
 * The little parcel a screen hands to the next one.
 *
 * React Router lets a navigation carry `state`, and the panel relies on it in
 * two places: a "saved" notice shown by the index screen after a form
 * redirects to it, and the address the login screen should return to. Next has
 * no equivalent, so the parcel is left in `sessionStorage` under the address it
 * is addressed to, and collected once by whoever arrives there.
 *
 * `sessionStorage` rather than a module variable so a parcel survives the
 * document reload that a full navigation can involve — which is exactly what
 * React Router's history-backed state did.
 */
const STATE_PREFIX = 'voy:nav-state:';

function depositState(to: string, state: unknown): void {
    if (typeof window === 'undefined' || state === undefined) {
        return;
    }

    try {
        window.sessionStorage.setItem(STATE_PREFIX + to.split(/[?#]/)[0], JSON.stringify(state));
    } catch {
        /* A private-mode browser with no storage quota still navigates fine. */
    }
}

function collectState(pathname: string): unknown {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const key = STATE_PREFIX + pathname;
        const parcel = window.sessionStorage.getItem(key);

        if (parcel === null) {
            return null;
        }

        // Collected once. A notice that survived every later visit to the
        // screen would be a notice nobody could dismiss.
        window.sessionStorage.removeItem(key);

        return JSON.parse(parcel);
    } catch {
        return null;
    }
}

/* -------------------------------------------------------------------- hooks */

export type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};

/**
 * `navigate(to, options)`, as React Router spells it.
 *
 * Returns a promise-shaped value because the call sites write `void
 * navigate(...)` — React Router's returns one, and keeping the shape means the
 * call sites do not have to change.
 */
export function useNavigate() {
    const router = useRouter();

    return useMemo(
        () =>
            (to: string, options: NavigateOptions = {}): Promise<void> => {
                depositState(to, options.state);

                if (options.replace) {
                    router.replace(to);
                } else {
                    router.push(to);
                }

                return Promise.resolve();
            },
        [router],
    );
}

export type Location = {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
};

/** The current address, plus whatever the previous screen left for this one. */
export function useLocation(): Location {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();

    /*
     * Collected during render rather than in an effect, because the screens
     * read it into `useState`'s initial value — an effect would run after that
     * first render and the notice would be missed.
     */
    const state = useMemo(() => collectState(pathname), [pathname]);

    return {
        pathname,
        search: search === '' ? '' : `?${search}`,
        hash: typeof window === 'undefined' ? '' : window.location.hash,
        state,
    };
}

export { useParams };

/* --------------------------------------------------------------- components */

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { to: string };

/** React Router's `Link`. Only the prop name differs from Next's. */
export function Link({ to, ...props }: LinkProps) {
    return <NextLink href={to} {...props} />;
}

type NavLinkRenderProps = { isActive: boolean };

type NavLinkProps = Omit<ComponentProps<typeof NextLink>, 'href' | 'className' | 'children'> & {
    to: string;
    /** Match the address exactly rather than as a prefix. */
    end?: boolean;
    className?: string | ((props: NavLinkRenderProps) => string);
    children?: ReactNode | ((props: NavLinkRenderProps) => ReactNode);
};

/**
 * React Router's `NavLink`: a link that knows whether it is the current one.
 *
 * `end` is honoured because the sidebar depends on it — without it `/admin`
 * would light up on every screen beneath it, since every one of them starts
 * with `/admin`.
 */
export function NavLink({ to, end = false, className, children, ...props }: NavLinkProps) {
    const pathname = usePathname();
    const target = to.split(/[?#]/)[0];

    const isActive = end
        ? pathname === target
        : pathname === target || pathname.startsWith(`${target}/`);

    return (
        <NextLink
            href={to}
            aria-current={isActive ? 'page' : undefined}
            className={typeof className === 'function' ? className({ isActive }) : className}
            {...props}
        >
            {typeof children === 'function' ? children({ isActive }) : children}
        </NextLink>
    );
}

/**
 * React Router's `Navigate`: redirect as a rendered element.
 *
 * The redirect is fired from an effect because Next's router may not be called
 * during render. Nothing is rendered in the meantime — the screens that use
 * this are already showing a splash or are about to be replaced.
 */
export function Navigate({
    to,
    replace = false,
    state,
}: {
    to: string;
    replace?: boolean;
    state?: unknown;
}) {
    const navigate = useNavigate();

    useEffect(() => {
        void navigate(to, { replace, state });
    }, [navigate, to, replace, state]);

    return null;
}
