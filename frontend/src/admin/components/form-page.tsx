import { AlertCircle } from 'lucide-react';
import type * as React from 'react';
import { Link } from '@/shared/router';

import { Breadcrumbs, type Crumb } from '@/admin/components/breadcrumbs';
import { PageHeader } from '@/admin/components/page-header';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * The shell every create and edit screen sits in.
 *
 * The trail, the title and whatever the record is are drawn first and stay put:
 * loading the record, failing to load it and saving it all happen underneath a
 * header that never moves. A page that blanks itself while it thinks costs the
 * editor their place, and they have to work out where they are again each time.
 *
 * Wide enough for the form to put its settings beside itself rather than after
 * itself — see `FormLayout`. No single field grows to that width: the columns
 * and grids inside hold every text box to a measure it is comfortable to fill
 * in, which is the part that actually mattered about a narrow page.
 */
export function FormPage({
    breadcrumbs,
    title,
    description,
    meta,
    error,
    children,
}: {
    breadcrumbs: Crumb[];
    title: string;
    description?: string;
    /** Facts about the record, shown under the title on edit screens. */
    meta?: React.ReactNode;
    /** A problem with the save just attempted. */
    error?: string | null;
    children: React.ReactNode;
}) {
    return (
        <div className="flex w-full max-w-6xl flex-col gap-5">
            <div>
                <Breadcrumbs items={breadcrumbs} />
                <PageHeader title={title} description={description} />
                {meta ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>
                ) : null}
            </div>

            {error ? (
                <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {children}
        </div>
    );
}

/**
 * The form's own shape, while it is being fetched.
 *
 * Two columns, like the form it stands in for. A skeleton that settled into a
 * different arrangement than the thing it was promising would move the page
 * under the editor at the moment it finished loading.
 */
export function FormSkeleton() {
    return (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="flex flex-col gap-4">
                <Skeleton className="h-52 w-full rounded-xl" />
                <Skeleton className="h-72 w-full rounded-xl" />
            </div>
            <div className="flex flex-col gap-4">
                <Skeleton className="h-56 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
        </div>
    );
}

/**
 * There is nothing to edit.
 *
 * Said in the place the form would have been, with the two ways out: try the
 * request again, or go back to the list it was reached from.
 */
export function LoadFailure({
    message,
    backHref,
    backLabel,
    onRetry,
}: {
    message: string;
    backHref: string;
    backLabel: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
                <AlertCircle
                    className="mt-0.5 size-5 shrink-0 text-destructive"
                    aria-hidden="true"
                />
                <p className="text-sm text-foreground">{message}</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {onRetry ? (
                    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                        Try again
                    </Button>
                ) : null}
                <Button asChild variant="ghost" size="sm">
                    <Link to={backHref}>{backLabel}</Link>
                </Button>
            </div>
        </div>
    );
}
