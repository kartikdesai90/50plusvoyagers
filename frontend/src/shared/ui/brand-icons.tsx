import type * as React from 'react';

import { Link2 } from 'lucide-react';

/**
 * Social glyphs drawn to match the reference design.
 *
 * Lucide dropped brand marks in v1, so these live here rather than coming from
 * a component library. In `shared` rather than in the site's own components
 * because both halves of the application need them now: the public footer draws
 * the profiles, and the settings screen labels the field each one is typed into.
 */
type IconProps = React.ComponentProps<'svg'>;

const strokeProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
} as const;

const solidProps = {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
} as const;

export function InstagramIcon(props: IconProps) {
    return (
        <svg {...strokeProps} {...props}>
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
    );
}

export function FacebookIcon(props: IconProps) {
    return (
        <svg {...solidProps} {...props}>
            <path d="M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1z" />
        </svg>
    );
}

export function WhatsAppIcon(props: IconProps) {
    return (
        <svg {...strokeProps} {...props}>
            <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
        </svg>
    );
}

export function YouTubeIcon(props: IconProps) {
    return (
        <svg {...solidProps} {...props}>
            <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
        </svg>
    );
}

export function LinkedInIcon(props: IconProps) {
    return (
        <svg {...solidProps} {...props}>
            <path d="M6.94 8.5H3.56V21h3.38zM5.25 3a1.97 1.97 0 1 0 0 3.94 1.97 1.97 0 0 0 0-3.94zM21 13.9c0-3.3-1.77-4.84-4.13-4.84a3.56 3.56 0 0 0-3.24 1.78h-.05V8.5H10.3V21h3.38v-6.19c0-1.63.31-3.21 2.33-3.21s2 1.86 2 3.31V21H21z" />
        </svg>
    );
}

/** X, still widely recognised by the bird's old name. */
export function XIcon(props: IconProps) {
    return (
        <svg {...solidProps} {...props}>
            <path d="M17.7 3h3.3l-7.2 8.2L22 21h-6.6l-5.2-6.7L4.3 21H1l7.7-8.8L1.3 3H8l4.7 6.2zm-1.2 16h1.8L7.6 4.8H5.7z" />
        </svg>
    );
}

/** Anywhere else a business has an account, with no mark of its own. */
export const OtherLinkIcon = Link2;
