import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'flex min-h-20 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                'placeholder:text-muted-foreground',
                'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
                'aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
