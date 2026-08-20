import type * as React from 'react';

/** A fact about the record, stated quietly beside the title. */
export function MetaBadge({
    children,
    tone = 'muted',
}: {
    children: React.ReactNode;
    tone?: 'muted' | 'active';
}) {
    return (
        <span
            className={
                tone === 'active'
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground'
            }
        >
            {children}
        </span>
    );
}
