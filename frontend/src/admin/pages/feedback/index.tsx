'use client';

import { AlertCircle, CheckCircle2, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useLocation } from '@/shared/router';

import { ConfirmDialog } from '@/admin/components/confirm-dialog';
import { Field } from '@/admin/components/form-section';
import { IconAction } from '@/admin/components/icon-action';
import { PageHeader } from '@/admin/components/page-header';
import { SelectField } from '@/admin/components/select-field';
import { FeedbackPreview } from '@/admin/features/feedback/feedback-preview';
import {
    deleteFeedback,
    listFeedback,
    updateFeedback,
} from '@/admin/features/feedback/feedback-api';
import { noFiles, toInput } from '@/admin/features/feedback/defaults';
import type { Feedback, FeedbackChoices } from '@/admin/features/feedback/types';
import { feedbackEditPath, paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Everything travellers have told us, written or filmed, in one table.
 *
 * Filtering and searching are the server's work here, unlike the handful of
 * homepage bands: a testimonial list only grows, and sending all of it so the
 * browser can hide most of it would get slower every month.
 */
export default function AdminFeedbackIndexPage() {
    const location = useLocation();

    const searchId = useId();
    const typeFilterId = useId();
    const statusFilterId = useId();
    const tourFilterId = useId();
    const sortId = useId();

    const [items, setItems] = useState<Feedback[]>([]);
    const [choices, setChoices] = useState<FeedbackChoices | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [tour, setTour] = useState('');
    const [sort, setSort] = useState('order');

    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(
        (location.state as { notice?: string } | null)?.notice ?? null,
    );
    const [busyId, setBusyId] = useState<number | null>(null);

    const [pendingRemoval, setPendingRemoval] = useState<Feedback | null>(null);
    const [viewing, setViewing] = useState<Feedback | null>(null);

    const load = useCallback(
        () =>
            listFeedback({
                search,
                type,
                status,
                tour_id: tour === '' ? '' : Number(tour),
                sort,
                page,
            })
                .then((response) => {
                    setError(null);
                    setItems(response.data);
                    setChoices({ types: response.meta.types, tours: response.meta.tours });
                    setLastPage(response.meta.last_page);
                    setTotal(response.meta.total);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [search, type, status, tour, sort, page],
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

    const toggle = async (record: Feedback, changes: Partial<Feedback>) => {
        setBusyId(record.id);
        setError(null);
        setNotice(null);

        try {
            await updateFeedback(record.id, { ...toInput(record), ...asInput(changes) }, noFiles);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (record: Feedback) => {
        setBusyId(record.id);
        setError(null);
        setNotice(null);

        try {
            await deleteFeedback(record.id);
            setNotice(`${record.customer_name}’s feedback has been removed.`);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const isFiltered = search.trim() !== '' || type !== '' || status !== '' || tour !== '';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Feedback"
                description="What travellers said about travelling with us — written quotes and filmed ones."
                actions={
                    <Button asChild>
                        <Link to={paths.admin.feedbackCreate}>
                            <Plus />
                            Add feedback
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
                <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Field label="Search" htmlFor={searchId}>
                        <Input
                            id={searchId}
                            value={search}
                            placeholder="Name, place or words"
                            onChange={(event) => changeFilter(() => setSearch(event.target.value))}
                        />
                    </Field>

                    <Field label="Type" htmlFor={typeFilterId}>
                        <SelectField
                            id={typeFilterId}
                            value={type}
                            onChange={(value) => changeFilter(() => setType(value))}
                            options={[
                                { value: '', label: 'All types' },
                                ...(choices?.types ?? []).map((choice) => ({
                                    value: choice.value,
                                    label: choice.label,
                                    description: choice.description,
                                })),
                            ]}
                        />
                    </Field>

                    <Field label="Status" htmlFor={statusFilterId}>
                        <SelectField
                            id={statusFilterId}
                            value={status}
                            onChange={(value) => changeFilter(() => setStatus(value))}
                            options={[
                                { value: '', label: 'Any status' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                        />
                    </Field>

                    {/* Appears the day the Tours module does. */}
                    {(choices?.tours ?? []).length > 0 ? (
                        <Field label="Tour" htmlFor={tourFilterId}>
                            <SelectField
                                id={tourFilterId}
                                value={tour}
                                onChange={(value) => changeFilter(() => setTour(value))}
                                options={[
                                    { value: '', label: 'All tours' },
                                    ...(choices?.tours ?? []).map((choice) => ({
                                        value: String(choice.id),
                                        label: choice.name,
                                    })),
                                ]}
                            />
                        </Field>
                    ) : null}

                    <Field label="Sort by" htmlFor={sortId}>
                        <SelectField
                            id={sortId}
                            value={sort}
                            onChange={(value) => changeFilter(() => setSort(value))}
                            options={[
                                { value: 'order', label: 'Display order' },
                                { value: 'newest', label: 'Recently added' },
                                { value: 'name', label: 'Customer name' },
                            ]}
                        />
                    </Field>
                </div>

                {isLoading ? (
                    <div className="flex flex-col gap-3 p-4">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Skeleton key={index} className="h-16 w-full" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        isFiltered={isFiltered}
                        onClear={() =>
                            changeFilter(() => {
                                setSearch('');
                                setType('');
                                setStatus('');
                                setTour('');
                            })
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[64rem] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left">
                                        <Th className="w-16">Photo</Th>
                                        <Th>Customer</Th>
                                        <Th className="w-24">Type</Th>
                                        <Th className="w-28">Status</Th>
                                        <Th className="w-24">Featured</Th>
                                        <Th className="w-20">Order</Th>
                                        <Th className="w-40 text-right">Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((record) => (
                                        <tr
                                            key={record.id}
                                            className="border-b border-border last:border-0 hover:bg-accent/40"
                                        >
                                            <Td>
                                                <Avatar record={record} />
                                            </Td>
                                            <Td>
                                                <Link
                                                    to={feedbackEditPath(record.id)}
                                                    className="font-medium text-foreground hover:underline"
                                                >
                                                    {record.customer_name}
                                                </Link>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {record.customer_location ??
                                                        'No location given'}
                                                </p>
                                            </Td>
                                            <Td>
                                                <Pill>{record.type_label}</Pill>
                                            </Td>
                                            <Td>
                                                <Status active={record.is_active} />
                                            </Td>
                                            <Td>
                                                {record.is_featured ? (
                                                    <Star
                                                        className="size-4 fill-brand text-brand"
                                                        aria-label="Featured"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </Td>
                                            <Td className="tabular-nums">{record.display_order}</Td>
                                            <Td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <IconAction
                                                        icon={Eye}
                                                        label={`View ${record.customer_name}’s feedback`}
                                                        onClick={() => setViewing(record)}
                                                    />
                                                    <IconAction
                                                        icon={Pencil}
                                                        label={`Edit ${record.customer_name}’s feedback`}
                                                        to={feedbackEditPath(record.id)}
                                                    />
                                                    <IconAction
                                                        icon={Star}
                                                        label={
                                                            record.is_featured
                                                                ? 'Remove from featured'
                                                                : 'Mark as featured'
                                                        }
                                                        disabled={busyId === record.id}
                                                        onClick={() =>
                                                            void toggle(record, {
                                                                is_featured: !record.is_featured,
                                                            })
                                                        }
                                                    />
                                                    <IconAction
                                                        icon={record.is_active ? EyeOff : Eye}
                                                        label={
                                                            record.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'
                                                        }
                                                        disabled={busyId === record.id}
                                                        onClick={() =>
                                                            void toggle(record, {
                                                                is_active: !record.is_active,
                                                            })
                                                        }
                                                    />
                                                    <IconAction
                                                        icon={Trash2}
                                                        label={`Remove ${record.customer_name}’s feedback`}
                                                        disabled={busyId === record.id}
                                                        onClick={() => setPendingRemoval(record)}
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
                                {total} {total === 1 ? 'testimonial' : 'testimonials'}
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

            <FeedbackPreview
                record={viewing}
                onOpenChange={(open) => {
                    if (!open) setViewing(null);
                }}
            />

            <ConfirmDialog
                open={pendingRemoval !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingRemoval(null);
                }}
                title="Remove this feedback?"
                description={
                    pendingRemoval
                        ? `${pendingRemoval.customer_name}’s feedback will be removed, along with any photo or film it carries. This cannot be undone.`
                        : ''
                }
                onConfirm={() => {
                    const record = pendingRemoval;
                    setPendingRemoval(null);
                    if (record) void remove(record);
                }}
            />
        </div>
    );
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
    return (
        <div className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">
                {isFiltered ? 'No feedback matches that.' : 'No feedback yet.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
                {isFiltered
                    ? 'Try a different word, or clear the filters.'
                    : 'Add what a traveller told you and it will appear here.'}
            </p>
            {isFiltered ? (
                <Button type="button" variant="outline" className="mt-4" onClick={onClear}>
                    Clear filters
                </Button>
            ) : (
                <Button asChild className="mt-4">
                    <Link to={paths.admin.feedbackCreate}>
                        <Plus />
                        Add feedback
                    </Link>
                </Button>
            )}
        </div>
    );
}

function Avatar({ record }: { record: Feedback }) {
    const source = record.photo_url ?? record.thumbnail_url;

    if (source) {
        return (
            <img
                src={source}
                alt={record.customer_name}
                className="size-10 rounded-full border border-border object-cover"
                loading="lazy"
            />
        );
    }

    return (
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {initials(record.customer_name)}
        </span>
    );
}

function Status({ active }: { active: boolean }) {
    return (
        <span
            className={
                active
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
            }
        >
            <span
                className={`size-1.5 rounded-full ${active ? 'bg-brand' : 'bg-muted-foreground/60'}`}
                aria-hidden="true"
            />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {children}
        </span>
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

function initials(name: string): string {
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

/** The two switches the list can flip, in the shape the form sends. */
function asInput(changes: Partial<Feedback>) {
    return {
        ...(changes.is_active === undefined ? {} : { is_active: changes.is_active }),
        ...(changes.is_featured === undefined ? {} : { is_featured: changes.is_featured }),
    };
}
