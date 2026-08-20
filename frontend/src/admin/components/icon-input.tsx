import type * as React from 'react';

import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';

/**
 * A text field with the mark of whatever it holds sitting inside it.
 *
 * Used for the contact details and the social profiles, where a column of a
 * dozen near-identical boxes is otherwise only told apart by reading every
 * label. The glyph is what the eye finds first, so an editor looking for the
 * Instagram box finds it without reading anything.
 *
 * Decoration, not information: the icon is `aria-hidden` and the field keeps
 * its own visible label, because a mark is only obvious to someone who already
 * recognises it and a screen reader would announce nothing at all.
 */
export function IconInput({
    icon: Icon,
    className,
    ...props
}: React.ComponentProps<typeof Input> & {
    icon: React.ComponentType<React.ComponentProps<'svg'>>;
}) {
    return (
        <div className="relative">
            <Icon
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
            />
            <Input className={cn('pl-9', className)} {...props} />
        </div>
    );
}
