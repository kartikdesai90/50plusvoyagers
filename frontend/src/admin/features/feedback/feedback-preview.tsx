import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import type { Feedback } from '@/admin/features/feedback/types';
import { cn } from '@/shared/lib/utils';

/**
 * One piece of feedback, read in full without leaving the list.
 *
 * The table truncates — it has to — and a quote is the one thing an editor most
 * often wants to read whole before deciding anything about it. Sending them to
 * the edit form to read it would mean opening a form to change nothing.
 */
export function FeedbackPreview({
    record,
    onOpenChange,
}: {
    record: Feedback | null;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <DialogPrimitive.Root open={record !== null} onOpenChange={onOpenChange}>
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
                        'admin-theme fixed top-1/2 left-1/2 z-50 w-[min(36rem,92vw)] -translate-x-1/2 -translate-y-1/2',
                        'max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card p-6 text-foreground shadow-xl',
                        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                        'motion-reduce:animate-none',
                    )}
                >
                    {record ? (
                        <>
                            <div className="flex items-start gap-4">
                                {record.photo_url ? (
                                    <img
                                        src={record.photo_url}
                                        alt={record.customer_name}
                                        className="size-14 shrink-0 rounded-full border border-border object-cover"
                                    />
                                ) : null}

                                <div className="min-w-0">
                                    <DialogPrimitive.Title className="text-base font-semibold">
                                        {record.customer_name}
                                    </DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                                        {[record.customer_location, record.type_label]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </DialogPrimitive.Description>
                                </div>
                            </div>

                            <div className="mt-5">
                                {record.type === 'video' && record.video_source ? (
                                    record.video_is_uploaded ? (
                                        <video
                                            className="w-full rounded-lg border border-border"
                                            src={record.video_source}
                                            poster={record.thumbnail_url ?? undefined}
                                            controls
                                            playsInline
                                        />
                                    ) : (
                                        /* A link may point at a player rather than a
                                           file, and this panel cannot know which. */
                                        <a
                                            href={record.video_source}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-brand underline underline-offset-4"
                                        >
                                            Open the film
                                        </a>
                                    )
                                ) : (
                                    <blockquote className="border-l-2 border-border pl-4 text-sm/relaxed text-foreground">
                                        {record.feedback_text}
                                    </blockquote>
                                )}
                            </div>
                        </>
                    ) : null}

                    <DialogPrimitive.Close
                        className={cn(
                            'absolute top-4 right-4 rounded-md p-1 text-muted-foreground transition-colors',
                            'hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none',
                        )}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
