import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

/** Placeholder block for loading states. Pulse is dropped under reduced motion. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="skeleton"
            aria-hidden="true"
            className={cn(
                'animate-pulse rounded-md bg-foreground/8 motion-reduce:animate-none',
                className,
            )}
            {...props}
        />
    );
}

export { Skeleton };
