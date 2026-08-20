import { Loader2 } from 'lucide-react';

/**
 * Suspense fallback for lazily-loaded route chunks.
 *
 * Lives in `shared/` and is deliberately area-neutral: the router must not
 * import from `site/` or `admin/`, or that area's code lands in the entry
 * chunk and both bundles grow.
 */
export function RouteFallback({ label = 'Loading…' }: { label?: string }) {
    return (
        <div className="flex min-h-dvh items-center justify-center bg-background">
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
