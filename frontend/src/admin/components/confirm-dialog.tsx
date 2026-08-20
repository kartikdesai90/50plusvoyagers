import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /** Name what is about to happen, and to which record. */
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
};

/**
 * The question asked before something cannot be undone.
 *
 * Built on the same Radix Dialog the navigation drawer uses, so focus trapping,
 * Escape and backdrop dismissal behave identically to the rest of the panel
 * rather than being approximated again here.
 *
 * The description names the record. "Are you sure?" asks someone to confirm a
 * decision they can no longer see.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Remove',
    cancelLabel = 'Cancel',
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(
                        'fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]',
                        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                        'motion-reduce:animate-none',
                    )}
                />
                <DialogPrimitive.Content
                    className={cn(
                        'admin-theme fixed top-1/2 left-1/2 z-50 w-[min(28rem,92vw)] -translate-x-1/2 -translate-y-1/2',
                        'rounded-xl border border-border bg-card p-6 text-foreground shadow-xl',
                        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                        'motion-reduce:animate-none',
                    )}
                >
                    <DialogPrimitive.Title className="text-base font-semibold">
                        {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
                        {description}
                    </DialogPrimitive.Description>

                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <DialogPrimitive.Close asChild>
                            <Button type="button" variant="outline">
                                {cancelLabel}
                            </Button>
                        </DialogPrimitive.Close>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                onOpenChange(false);
                                onConfirm();
                            }}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
