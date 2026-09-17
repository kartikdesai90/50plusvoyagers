'use client';

import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useLocation } from '@/shared/router';

import { ConfirmDialog } from '@/admin/components/confirm-dialog';
import { Field } from '@/admin/components/form-section';
import { IconAction } from '@/admin/components/icon-action';
import { PageHeader } from '@/admin/components/page-header';
import { SelectField } from '@/admin/components/select-field';
import { formatEndDate, pageProgress } from '@/admin/features/tours/defaults';
import { deleteTour, listTours } from '@/admin/features/tours/tours-api';
import type { Tour } from '@/admin/features/tours/types';
import { paths, tourEditPath } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Every group tour the CRM records.
 *
 * A plain table: five fields, no picture to preview and nothing to switch on or
 * off. What an editor comes here to do is find a tour by name or code, correct
 * it, or add one — so the search covers both and the rest stays out of the way.
 */
export default function AdminToursIndexPage() {
    const location = useLocation();

    const searchId = useId();
    const sortId = useId();

    const [tours, setTours] = useState<Tour[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('');

    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(
        (location.state as { notice?: string } | null)?.notice ?? null,
    );
    const [busyId, setBusyId] = useState<number | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<Tour | null>(null);

    const load = useCallback(
        () =>
            listTours({ search, sort, page })
                .then((response) => {
                    setError(null);
                    setTours(response.data);
                    setLastPage(response.meta.last_page);
                    setTotal(response.meta.total);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [search, sort, page],
    );

    /* Typing filters the list, so the request waits for a pause in it. */
    useEffect(() => {
        const timer = setTimeout(() => void load(), 250);

        return () => clearTimeout(timer);
    }, [load]);

    const changeFilter = (apply: () => void) => {
        setPage(1);
        apply();
    };

    const remove = async (tour: Tour) => {
        setBusyId(tour.id);
        setError(null);
        setNotice(null);

        try {
            await deleteTour(tour.id);
            setNotice(`“${tour.tour_name}” has been removed.`);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const isFiltered = search.trim() !== '';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Tours"
                description="The group tours as the CRM records them, with the code each departure is matched on."
                actions={
                    <Button asChild>
                        <Link to={paths.admin.tourCreate}>
                            <Plus />
                            Add tour
                        </Link>
                    </Button>
                }
            />

            {error ? (
                <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription className="flex flex-wrap items-center gap-3">
                        {error}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setLoading(true);
                                void load();
                            }}
                        >
                            Try again
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : null}

            {notice ? (
                <Alert>
                    <CheckCircle2 />
                    <AlertDescription>{notice}</AlertDescription>
                </Alert>
            ) : null}

            <Card className="gap-0 py-0">
                <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-2">
                    <Field label="Search" htmlFor={searchId}>
                        <Input
                            id={searchId}
                            value={search}
                            placeholder="Tour name or code"
                            onChange={(event) => changeFilter(() => setSearch(event.target.value))}
                        />
                    </Field>

                    <Field label="Sort by" htmlFor={sortId}>
                        <SelectField
                            id={sortId}
                            value={sort}
                            onChange={(value) => changeFilter(() => setSort(value))}
                            options={[
                                { value: '', label: 'Ending soonest' },
                                { value: 'name', label: 'Tour name' },
                                { value: 'code', label: 'Tour code' },
                                { value: 'newest', label: 'Recently added' },
                            ]}
                        />
                    </Field>
                </div>

                {isLoading ? (
                    <div className="flex flex-col gap-3 p-4">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Skeleton key={index} className="h-14 w-full" />
                        ))}
                    </div>
                ) : tours.length === 0 ? (
                    <EmptyState
                        isFiltered={isFiltered}
                        onClear={() => changeFilter(() => setSearch(''))}
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[42rem] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left">
                                        <Th>Tour</Th>
                                        <Th className="w-56">Code</Th>
                                        <Th className="w-28">Page</Th>
                                        <Th className="w-36">Ends</Th>
                                        <Th className="w-28 text-right">Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tours.map((tour) => (
                                        <tr
                                            key={tour.id}
                                            className="border-b border-border last:border-0 hover:bg-accent/40"
                                        >
                                            <Td>
                                                <Link
                                                    to={tourEditPath(tour.id)}
                                                    className="font-medium text-foreground hover:underline"
                                                >
                                                    {tour.tour_name}
                                                </Link>
                                            </Td>
                                            <Td>
                                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                                    {tour.tour_code}
                                                </code>
                                            </Td>
                                            <Td>
                                                <PageState tour={tour} />
                                            </Td>
                                            <Td className="text-muted-foreground tabular-nums">
                                                {formatEndDate(tour.end_date)}
                                            </Td>
                                            <Td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <IconAction
                                                        icon={Pencil}
                                                        label={`Edit ${tour.tour_name}`}
                                                        to={tourEditPath(tour.id)}
                                                    />
                                                    <IconAction
                                                        icon={Trash2}
                                                        label={`Remove ${tour.tour_name}`}
                                                        disabled={busyId === tour.id}
                                                        onClick={() => setPendingRemoval(tour)}
                                                    />
                                                </div>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                                {total} {total === 1 ? 'tour' : 'tours'}
                                {lastPage > 1 ? ` · page ${page} of ${lastPage}` : ''}
                            </p>
                            {lastPage > 1 ? (
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage((current) => current - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={page === lastPage}
                                        onClick={() => setPage((current) => current + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </>
                )}
            </Card>

            <ConfirmDialog
                open={pendingRemoval !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingRemoval(null);
                }}
                title="Remove this tour?"
                description={
                    pendingRemoval
                        ? `“${pendingRemoval.tour_name}” will be removed. This cannot be undone.`
                        : ''
                }
                onConfirm={() => {
                    const tour = pendingRemoval;
                    setPendingRemoval(null);
                    if (tour) void remove(tour);
                }}
            />
        </div>
    );
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
    return (
        <div className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">
                {isFiltered ? 'No tour matches that.' : 'No tours yet.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
                {isFiltered
                    ? 'Try a different word, or clear the search.'
                    : 'Add one and it will appear here, soonest to end first.'}
            </p>
            {isFiltered ? (
                <Button type="button" variant="outline" className="mt-4" onClick={onClear}>
                    Clear search
                </Button>
            ) : (
                <Button asChild className="mt-4">
                    <Link to={paths.admin.tourCreate}>
                        <Plus />
                        Add tour
                    </Link>
                </Button>
            )}
        </div>
    );
}

/**
 * Whether this tour has a written page yet.
 *
 * The question an editor actually has when they open this list: with
 * thirty-two pages to migrate, which are done? A published tour with no
 * content is the case worth catching — it renders, but it renders empty.
 */
function PageState({ tour }: { tour: Tour }) {
    const { written, summary } = pageProgress(tour);
    const live = tour.status === 'published' && Boolean(tour.slug);

    return (
        <div className="flex flex-col gap-1">
            <span
                className={
                    live
                        ? 'inline-flex w-fit items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand'
                        : 'inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
                }
            >
                <span
                    className={`size-1.5 rounded-full ${live ? 'bg-brand' : 'bg-muted-foreground/60'}`}
                    aria-hidden="true"
                />
                {live ? 'Live' : 'Draft'}
            </span>
            {summary ? (
                <span
                    className={`text-[11px] ${written ? 'text-muted-foreground' : 'text-amber-600'}`}
                >
                    {summary}
                </span>
            ) : null}
        </div>
    );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <th
            scope="col"
            className={`px-4 py-3 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase ${className ?? ''}`}
        >
            {children}
        </th>
    );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>;
}
