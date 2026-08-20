import { Loader2 } from 'lucide-react';

/**
 * Shown while the existing session is being resolved. Deliberately quiet — it
 * appears for a few hundred milliseconds at most and should not flash colour.
 */
export function AdminSplash({ label = 'Loading…' }: { label?: string }) {
    return (
        <div className="admin-theme flex min-h-dvh items-center justify-center bg-background">
            <div
                className="flex flex-col items-center gap-3 text-muted-foreground"
                role="status"
                aria-live="polite"
            >
                <Loader2
                    className="size-5 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                />
                <span className="text-sm">{label}</span>
            </div>
        </div>
    );
}
