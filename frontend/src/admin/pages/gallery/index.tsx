'use client';

import { AlertCircle, CheckCircle2, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useLocation } from '@/shared/router';

import { ConfirmDialog } from '@/admin/components/confirm-dialog';
import { Field } from '@/admin/components/form-section';
import { IconAction } from '@/admin/components/icon-action';
import { PageHeader } from '@/admin/components/page-header';
import { SelectField } from '@/admin/components/select-field';
import { toInput } from '@/admin/features/gallery/defaults';
import {
    deleteGalleryItem,
    listGallery,
    updateGalleryItem,
} from '@/admin/features/gallery/gallery-api';
import type { GalleryChoices, GalleryItem } from '@/admin/features/gallery/types';
import { galleryEditPath, paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Every photograph in the gallery.
 *
 * A table with a real preview in it rather than a grid of thumbnails: an editor
 * here is checking order, captions and what is switched on, and a wall of
 * pictures answers none of those questions.
 */
export default function AdminGalleryIndexPage() {
    const location = useLocation();

    const searchId = useId();
    const statusFilterId = useId();
    const tourFilterId = useId();
    const sortId = useId();

    const [items, setItems] = useState<GalleryItem[]>([]);
    const [choices, setChoices] = useState<GalleryChoices | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [tour, setTour] = useState('');
    const [sort, setSort] = useState('order');

    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(
        (location.state as { notice?: string } | null)?.notice ?? null,
    );
    const [busyId, setBusyId] = useState<number | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<GalleryItem | null>(null);

    const load = useCallback(
        () =>
            listGallery({
                search,
                status,
                tour_id: tour === '' ? '' : Number(tour),
                sort,
                page,
            })
                .then((response) => {
                    setError(null);
                    setItems(response.data);
                    setChoices({ tours: response.meta.tours });
                    setLastPage(response.meta.last_page);
                    setTotal(response.meta.total);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [search, status, tour, sort, page],
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

    /** The two switches the list can flip, in the shape the form sends. */
    const toggle = async (
        item: GalleryItem,
        changes: { is_active?: boolean; is_featured?: boolean },
    ) => {
        setBusyId(item.id);
        setError(null);
        setNotice(null);

        try {
            await updateGalleryItem(item.id, { ...toInput(item), ...changes }, null);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (item: GalleryItem) => {
        setBusyId(item.id);
        setError(null);
        setNotice(null);

        try {
            await deleteGalleryItem(item.id);
            setNotice(`“${item.title}” has been removed from the gallery.`);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const isFiltered = search.trim() !== '' || status !== '' || tour !== '';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Gallery"
                description="Photographs from the road, shown on the homepage and the gallery page."
                actions={
                    <Button asChild>
                        <Link to={paths.admin.galleryCreate}>
                            <Plus />
                            Add photograph
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
                <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Search" htmlFor={searchId}>
                        <Input
                            id={searchId}
                            value={search}
                            placeholder="Title or caption"
                            onChange={(event) => changeFilter(() => setSearch(event.target.value))}
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
                                { value: 'title', label: 'Title' },
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
                                setStatus('');
                                setTour('');
                            })
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[56rem] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left">
                                        <Th className="w-28">Preview</Th>
                                        <Th>Title</Th>
                                        <Th className="w-28">Status</Th>
                                        <Th className="w-24">Featured</Th>
                                        <Th className="w-20">Order</Th>
                                        <Th className="w-40 text-right">Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-border last:border-0 hover:bg-accent/40"
                                        >
                                            <Td>
                                                <img
                                                    src={item.image_url}
                                                    alt={item.described_as}
                                                    className="aspect-4/3 w-20 rounded-md border border-border object-cover"
                                                    loading="lazy"
                                                />
                                            </Td>
                                            <Td>
                                                <Link
                                                    to={galleryEditPath(item.id)}
                                                    className="font-medium text-foreground hover:underline"
                                                >
                                                    {item.title}
                                                </Link>
                                                {item.caption ? (
                                                    <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                                                        {item.caption}
                                                    </p>
                                                ) : null}
                                            </Td>
                                            <Td>
                                                <Status active={item.is_active} />
                                            </Td>
                                            <Td>
                                                {item.is_featured ? (
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
                                            <Td className="tabular-nums">{item.display_order}</Td>
                                            <Td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <IconAction
                                                        icon={Pencil}
                                                        label={`Edit ${item.title}`}
                                                        to={galleryEditPath(item.id)}
                                                    />
                                                    <IconAction
                                                        icon={Star}
                                                        label={
                                                            item.is_featured
                                                                ? 'Remove from featured'
                                                                : 'Mark as featured'
                                                        }
                                                        disabled={busyId === item.id}
                                                        onClick={() =>
                                                            void toggle(item, {
                                                                is_featured: !item.is_featured,
                                                            })
                                                        }
                                                    />
                                                    <IconAction
                                                        icon={item.is_active ? EyeOff : Eye}
                                                        label={
                                                            item.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'
                                                        }
                                                        disabled={busyId === item.id}
                                                        onClick={() =>
                                                            void toggle(item, {
                                                                is_active: !item.is_active,
                                                            })
                                                        }
                                                    />
                                                    <IconAction
                                                        icon={Trash2}
                                                        label={`Remove ${item.title}`}
                                                        disabled={busyId === item.id}
                                                        onClick={() => setPendingRemoval(item)}
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
                                {total} {total === 1 ? 'photograph' : 'photographs'}
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
                title="Remove this photograph?"
                description={
                    pendingRemoval
                        ? `“${pendingRemoval.title}” will be removed from the gallery and its file deleted. This cannot be undone.`
                        : ''
                }
                onConfirm={() => {
                    const item = pendingRemoval;
                    setPendingRemoval(null);
                    if (item) void remove(item);
                }}
            />
        </div>
    );
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
    return (
        <div className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">
                {isFiltered ? 'No photograph matches that.' : 'No photographs yet.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
                {isFiltered
                    ? 'Try a different word, or clear the filters.'
                    : 'Add one and it will appear here in the order you give it.'}
            </p>
            {isFiltered ? (
                <Button type="button" variant="outline" className="mt-4" onClick={onClear}>
                    Clear filters
                </Button>
            ) : (
                <Button asChild className="mt-4">
                    <Link to={paths.admin.galleryCreate}>
                        <Plus />
                        Add photograph
                    </Link>
                </Button>
            )}
        </div>
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
