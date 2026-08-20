import { ChevronDown } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

/**
 * The browser's own list of choices, dressed to match the panel's inputs.
 *
 * Deliberately not a built one: on a phone this opens the native picker, it is
 * keyboard-operable and screen-reader-correct with nothing wired up, and it
 * costs nothing to load. What is styled is the closed control — the open list
 * is drawn by the operating system and no CSS reaches it, which is the reason
 * option labels here are kept to a word or two.
 */
function Select({ className, ...props }: React.ComponentProps<'select'>) {
    return (
        <div className="relative">
            <select
                data-slot="select"
                className={cn(
                    'h-11 w-full min-w-0 appearance-none truncate rounded-lg border border-input bg-card py-2 pr-9 pl-3.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                    'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
                    'aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    className,
                )}
                {...props}
            />
            <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
            />
        </div>
    );
}

export { Select };
