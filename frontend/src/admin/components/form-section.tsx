import { AlertCircle } from 'lucide-react';
import type * as React from 'react';

import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/lib/utils';

/**
 * The two-column shape every create and edit screen is built on.
 *
 * The wide column is the record — what the thing is, what it says, what it
 * shows. The narrow one is the decisions about it: whether it is published,
 * where it sits, how it is filed. Splitting them is what makes a long form
 * scannable: an editor writing a post is never scrolling past a display-order
 * field to reach the next paragraph, and an editor who only came to switch
 * something on can see it without reading the form at all.
 *
 * One column below `xl`, in the same order — the record first, the decisions
 * after it. A settings column beside a form needs about 340px to be worth
 * having, and a tablet that gave it that would have nothing left for the form.
 */
export function FormLayout({ main, aside }: { main: React.ReactNode; aside?: React.ReactNode }) {
    if (!aside) {
        return <div className="flex flex-col gap-4">{main}</div>;
    }

    return (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* `min-w-0`: a grid child will not shrink below its content
                otherwise, and one long unbroken word in a text box would push
                the settings column off the screen. */}
            <div className="flex min-w-0 flex-col gap-4">{main}</div>
            <div className="flex min-w-0 flex-col gap-4">{aside}</div>
        </div>
    );
}

/**
 * One named part of a form, in a card of its own.
 *
 * The name sits in a head of its own, ruled off from the fields under it, so a
 * card has a shape rather than being a heading that happens to be followed by
 * inputs. That rule is doing the work the old block of margin was doing, in
 * four pixels instead of twenty.
 */
export function FormSection({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    /** Applied to the fields, not the card. */
    className?: string;
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {description ? (
                    <p className="mt-0.5 text-xs/relaxed text-muted-foreground">{description}</p>
                ) : null}
            </div>

            <div className={cn('flex flex-col gap-4 p-4 sm:p-5', className)}>{children}</div>
        </section>
    );
}

/**
 * Fields that belong beside each other.
 *
 * Two across from the small breakpoint up, one below it. Used wherever a pair
 * of fields is genuinely a pair — a name and where they are from, a status and
 * a date — so the pairing is the same shape in every module rather than each
 * form writing its own grid. A field that needs the full width inside one asks
 * for it with `className="sm:col-span-2"`.
 */
export function FormGrid({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

/**
 * A labelled field with its hint and its error.
 *
 * The error sits directly under the field it belongs to rather than in a
 * summary at the top: an editor correcting a form is looking at the field, not
 * at a banner they have already scrolled past. It replaces the hint rather than
 * joining it, so there is only ever one line to read — and it arrives with an
 * icon, because a line of small red text is easy to take for more grey hint
 * text at a glance.
 */
export function Field({
    label,
    htmlFor,
    hint,
    error,
    required,
    className,
    children,
}: {
    label: string;
    htmlFor: string;
    hint?: string;
    error?: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
            <Label htmlFor={htmlFor} className={error ? 'text-destructive' : undefined}>
                {label}
                {required ? (
                    <span className="text-[11px] font-normal text-muted-foreground">Required</span>
                ) : null}
            </Label>
            {children}
            {error ? (
                <p
                    role="alert"
                    className="flex items-start gap-1.5 text-xs font-medium text-destructive"
                >
                    <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            ) : hint ? (
                <p className="text-xs/relaxed text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}
