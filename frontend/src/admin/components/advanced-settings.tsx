import { ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';

/**
 * The settings almost nobody needs, folded away until they do.
 *
 * A native disclosure: keyboard-operable and announced correctly with nothing
 * wired up, and nothing to animate. It opens itself when `forceOpen` is set —
 * a problem with a field in here has to bring the field into view, or the
 * server's complaint is reported somewhere nobody is looking.
 */
export function AdvancedSettings({
    forceOpen = false,
    children,
}: {
    forceOpen?: boolean;
    children: ReactNode;
}) {
    const [isOpen, setOpen] = useState(false);

    return (
        <details
            open={isOpen || forceOpen}
            onToggle={(event) => setOpen(event.currentTarget.open)}
            className="group"
        >
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                <ChevronRight
                    className="size-4 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    aria-hidden="true"
                />
                Advanced settings
            </summary>

            <div className="mt-4">{children}</div>
        </details>
    );
}
