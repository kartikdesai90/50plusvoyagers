'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect } from 'react';

import { EnquiryForm } from '@/site/components/enquiry-form';
import { cn } from '@/shared/lib/utils';

type EnquiryModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Prefixes field ids, so the modal can sit on a page that already has a form. */
    formId: string;
    /** Pre-fills the message, the way the on-page form named the tour. */
    subject: string;
};

/**
 * The tour enquiry, as a dialog.
 *
 * The same fields as the old "Next step" band — name, mobile, email, message
 * — opened from "Enquire about this trip" rather than sitting at the foot of
 * the page. Radix Dialog supplies focus trapping, Escape and backdrop
 * dismissal, matching the rest of the site's overlays.
 *
 * The form is taller than a short viewport, so the card is a flex column with
 * a dedicated scroll pane (`data-lenis-prevent`). Lenis otherwise captures
 * the wheel and the page behind the dialog moves instead of the fields.
 */
export function EnquiryModal({ open, onOpenChange, formId, subject }: EnquiryModalProps) {
    useEffect(() => {
        if (!open) return;

        window.dispatchEvent(new CustomEvent('voy:overlay', { detail: true }));

        return () => {
            window.dispatchEvent(new CustomEvent('voy:overlay', { detail: false }));
        };
    }, [open]);

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className={cn(
                        'fixed inset-0 z-[80] bg-ink/40 backdrop-blur-[2px]',
                        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                        'motion-reduce:animate-none',
                    )}
                />
                <DialogPrimitive.Content
                    data-lenis-prevent
                    className={cn(
                        'fixed top-1/2 left-1/2 z-[80] flex w-[min(720px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col',
                        'max-h-[min(calc(100dvh-2rem),840px)] overflow-hidden',
                        'rounded-2xl border border-hairline bg-surface text-ink shadow-xl',
                        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
                        'motion-reduce:animate-none',
                    )}
                    onWheel={(event) => event.stopPropagation()}
                    onTouchMove={(event) => event.stopPropagation()}
                >
                    <div className="relative shrink-0 px-[clamp(24px,3.4vw,40px)] pt-[clamp(24px,3vw,36px)] pb-2">
                        <DialogPrimitive.Title className="voy-heading pr-10 text-[clamp(22px,2.4vw,30px)]">
                            Enquire about this trip
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description className="mt-3 max-w-[520px] text-[16px]/[1.6] text-ink-muted">
                            Tell us a little about yourself and we will send the full itinerary,
                            what the price covers, and the dates still open.
                        </DialogPrimitive.Description>

                        <DialogPrimitive.Close
                            className="absolute top-[clamp(20px,2.4vw,28px)] right-[clamp(16px,2vw,24px)] rounded-full p-1.5 text-ink-muted transition-colors hover:bg-hairline hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                            aria-label="Close enquiry form"
                        >
                            <X className="size-5" aria-hidden="true" />
                        </DialogPrimitive.Close>
                    </div>

                    {/*
                     * `min-h-0` is what lets a flex child shrink and then
                     * scroll. Without it the form grows to its full height,
                     * the card clips the submit button, and there is nothing
                     * to scroll.
                     */}
                    <div
                        data-lenis-prevent
                        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                    >
                        <EnquiryForm
                            id={formId}
                            subject={subject}
                            submitLabel="Request details"
                            className="border-0 bg-transparent p-[clamp(24px,3.4vw,40px)] pt-[clamp(16px,2vw,24px)]"
                        />
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
