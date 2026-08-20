import { ArrowRight } from 'lucide-react';
import type * as React from 'react';

import { emphasised } from '@/site/components/emphasis';
import { cn } from '@/shared/lib/utils';

type Tone = 'surface' | 'alt';
type Space = 'lg' | 'sm' | 'none';

const toneClass: Record<Tone, string> = {
    surface: 'bg-surface',
    alt: 'bg-surface-alt',
};

const topClass: Record<Space, string> = {
    lg: 'pt-section',
    sm: 'pt-section-sm',
    none: '',
};

const bottomClass: Record<Space, string> = {
    lg: 'pb-section',
    sm: 'pb-section-sm',
    none: '',
};

type SectionProps = React.ComponentProps<'section'> & {
    tone?: Tone;
    top?: Space;
    bottom?: Space;
};

/**
 * Full-bleed band with the reference's fluid vertical rhythm.
 *
 * Two sections always stack their facing spaces, so the gap between them is the
 * sum of one's `bottom` and the next one's `top` — which is why the page reads
 * in seams rather than in sections:
 *
 * - A tone change earns a full seam: `lg` against `sm`. The band either side is
 *   a different colour, and the space is what lets the eye find the edge.
 * - Same ground either way, one side gives: `lg` against `none`. There is no
 *   edge to find, so two sections both paying for an invisible seam is how a
 *   page ends up with a screen of nothing in the middle of it.
 *
 * A section that sets both sides to `lg` is almost always wrong next to another
 * that does the same. Check what it actually abuts before adding space to it.
 */
export function Section({
    className,
    tone = 'surface',
    top = 'lg',
    bottom = 'lg',
    children,
    ...props
}: SectionProps) {
    return (
        <section
            className={cn(toneClass[tone], topClass[top], bottomClass[bottom], className)}
            {...props}
        >
            {children}
        </section>
    );
}

/** Centred 1180px measure with the shared fluid gutter. */
export function Container({ className, ...props }: React.ComponentProps<'div'>) {
    return <div className={cn('voy-container', className)} {...props} />;
}

export function Eyebrow({ className, ...props }: React.ComponentProps<'p'>) {
    return <p className={cn('voy-eyebrow', className)} {...props} />;
}

type HeadingProps = React.ComponentProps<'h2'> & {
    size?: 'h2' | 'h3';
};

/**
 * A section title.
 *
 * Asterisks around a word set it in the brand italic — the same notation the
 * hero heading uses, applied here so every title on the site is marked the one
 * way. A heading handed markup instead of a string keeps whatever it was given.
 */
export function SectionHeading({ className, size = 'h2', children, ...props }: HeadingProps) {
    return (
        <h2
            className={cn('voy-heading', size === 'h2' ? 'text-h2' : 'text-h3', className)}
            {...props}
        >
            {emphasised(children)}
        </h2>
    );
}

/** Uppercase link with a rule underneath and an arrow that slides on hover. */
export function RuleLink({
    className,
    children,
    ...props
}: React.ComponentProps<'a'> & { children: React.ReactNode }) {
    return (
        <a
            className={cn(
                'group/link inline-flex items-center gap-2 border-b-[1.5px] border-ink pb-1.5 text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:border-brand hover:text-brand',
                className,
            )}
            {...props}
        >
            {children}
            <ArrowRight
                className="size-3.5 transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.24,1)] group-hover/link:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/link:translate-x-0"
                aria-hidden="true"
            />
        </a>
    );
}
