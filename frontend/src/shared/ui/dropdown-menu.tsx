import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import type * as React from 'react';

import { cn } from '@/shared/lib/utils';

function DropdownMenu(props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger(props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
    return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
    className,
    sideOffset = 8,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                className={cn(
                    'z-50 min-w-56 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg',
                    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                    'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
                    'motion-reduce:animate-none',
                    className,
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuItem({
    className,
    variant = 'default',
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    variant?: 'default' | 'destructive';
}) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-variant={variant}
            className={cn(
                'relative flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none select-none',
                'transition-colors focus:bg-accent focus:text-accent-foreground',
                'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/8',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg:not([class*='text-'])]:text-muted-foreground",
                'data-[variant=destructive]:[&_svg]:text-destructive',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuRadioGroup(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
    return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

/**
 * One choice among several, which is what a menu becomes when it is standing in
 * for a list of options: the chosen one is announced as chosen rather than
 * merely looking different.
 */
function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(
                'relative flex cursor-pointer items-start gap-3 rounded-lg py-2 pr-2.5 pl-9 text-sm outline-none select-none',
                'transition-colors focus:bg-accent focus:text-accent-foreground',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className,
            )}
            {...props}
        >
            <span className="absolute top-2.5 left-2.5 flex size-4 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check className="size-4 text-brand" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            className={cn('px-2.5 py-2', className)}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn('-mx-1.5 my-1.5 h-px bg-border', className)}
            {...props}
        />
    );
}

export {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
};
