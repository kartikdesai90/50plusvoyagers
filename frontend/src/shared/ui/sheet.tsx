import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

/**
 * Slide-over panel built on Radix Dialog, so focus trapping, Escape handling,
 * scroll locking and backdrop dismissal come for free.
 */
function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({
    className,
    children,
    side = 'left',
    title,
    description,
    closeLabel = 'Close navigation',
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
    side?: 'left' | 'right';
    /** Required by Radix for an accessible name; visually hidden. */
    title: string;
    description?: string;
    /**
     * What the close button announces. Defaults to the navigation drawer's
     * wording, which was the only use when this was written — any other panel
     * should say what it is actually closing.
     */
    closeLabel?: string;
}) {
    return (
        <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay
                className={cn(
                    'fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]',
                    'data-[state=open]:animate-in data-[state=open]:fade-in-0',
                    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                    'motion-reduce:animate-none',
                )}
            />
            <SheetPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    'fixed inset-y-0 z-50 flex w-[min(19rem,85vw)] flex-col bg-card shadow-xl',
                    'transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
                    'data-[state=closed]:animate-out data-[state=open]:animate-in',
                    side === 'left'
                        ? 'left-0 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left'
                        : 'right-0 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
                    'motion-reduce:animate-none motion-reduce:transition-none',
                    className,
                )}
                {...props}
            >
                <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
                <SheetPrimitive.Description className="sr-only">
                    {description ?? title}
                </SheetPrimitive.Description>

                {children}

                <SheetPrimitive.Close
                    className={cn(
                        'absolute top-4 right-4 rounded-md p-1 text-muted-foreground transition-colors',
                        'hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none',
                    )}
                >
                    <X className="size-4" />
                    <span className="sr-only">{closeLabel}</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
    );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };
