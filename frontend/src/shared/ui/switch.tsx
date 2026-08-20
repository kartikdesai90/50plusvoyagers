import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

/**
 * An on/off control that looks like one.
 *
 * A checkbox says "tick this to agree"; a switch says "this is on". For a
 * setting that takes effect the moment it is saved, the second reading is the
 * right one.
 *
 * Underneath it is still a checkbox — it keeps the label association, the
 * keyboard behaviour and the form value that a built control would have to
 * reimplement. Only the appearance is ours.
 */
function Switch({ className, ...props }: React.ComponentProps<'input'>) {
    return (
        <span className="relative inline-flex shrink-0">
            <input type="checkbox" className={cn('peer sr-only', className)} {...props} />
            <span
                aria-hidden="true"
                className={cn(
                    'block h-6 w-11 rounded-full bg-input transition-colors',
                    'peer-checked:bg-brand',
                    'peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/25',
                    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                    'motion-reduce:transition-none',
                )}
            />
            <span
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                    'peer-checked:translate-x-5',
                    'motion-reduce:transition-none',
                )}
            />
        </span>
    );
}

export { Switch };
