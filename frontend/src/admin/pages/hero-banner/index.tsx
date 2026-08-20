'use client';

import {
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    ExternalLink,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Link, useLocation } from '@/shared/router';

import { ConfirmDialog } from '@/admin/components/confirm-dialog';
import { Field } from '@/admin/components/form-section';
import { IconAction } from '@/admin/components/icon-action';
import { PageHeader } from '@/admin/components/page-header';
import { SelectField } from '@/admin/components/select-field';
import {
    deleteHeroBanner,
    listHeroBanners,
    updateHeroBanner,
} from '@/admin/features/hero-banners/hero-banners-api';
import type { HeroBanner, HeroBannerChoices } from '@/admin/features/hero-banners/types';
import { heroBannerEditPath, paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Every hero slide and banner band, in one table.
 *
 * A list is for finding and for seeing the running order at a glance, so each
 * row carries what an editor scans by eye and its actions are icons — six text
 * buttons per row is a table nobody can read. Everything about one band lives
 * on its own page.
 *
 * Filtering happens here rather than on the server: a homepage has a handful of
 * bands, they all arrive in one request, and a round trip per keystroke would
 * cost more than the work it saves.
 */
export default function AdminHeroBannerIndexPage() {
    const location = useLocation();

    const searchId = useId();
    const sectionFilterId = useId();
    const statusFilterId = useId();

    const [bands, setBands] = useState<HeroBanner[]>([]);
    const [choices, setChoices] = useState<HeroBannerChoices | null>(null);

    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    /* Carried here by the create and edit screens after they save. */
    const [notice, setNotice] = useState<string | null>(
        (location.state as { notice?: string } | null)?.notice ?? null,
    );
    const [busyId, setBusyId] = useState<number | null>(null);

    const [search, setSearch] = useState('');
    const [section, setSection] = useState('');
    const [status, setStatus] = useState('');

    /** The band the confirmation is asking about. */
    const [pendingRemoval, setPendingRemoval] = useState<HeroBanner | null>(null);

    const load = useCallback(
        () =>
            listHeroBanners()
                .then((response) => {
                    setError(null);
                    setBands(response.data);
                    setChoices(response.meta);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const retry = () => {
        setLoading(true);
        void load();
    };

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();

        return bands.filter((band) => {
            if (section && band.section_type !== section) return false;
            if (status === 'active' && !band.is_active) return false;
            if (status === 'inactive' && band.is_active) return false;
            if (term === '') return true;

            return `${band.heading} ${band.label ?? ''}`.toLowerCase().includes(term);
        });
    }, [bands, search, section, status]);

    const isFiltered = search.trim() !== '' || section !== '' || status !== '';

    const clearFilters = () => {
        setSearch('');
        setSection('');
        setStatus('');
    };

    const toggleActive = async (band: HeroBanner) => {
        setBusyId(band.id);
        setError(null);
        setNotice(null);

        try {
            await updateHeroBanner(band.id, asInput(band, { is_active: !band.is_active }), null);
            setNotice(
                band.is_active
                    ? `“${band.heading}” is now hidden from the homepage.`
                    : `“${band.heading}” is now showing on the homepage.`,
            );
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (band: HeroBanner) => {
        setBusyId(band.id);
        setError(null);
        setNotice(null);

        try {
            await deleteHeroBanner(band.id);
            setNotice(`“${band.heading}” has been removed from the homepage.`);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Hero & Banner"
                description="The slider at the top of the homepage, and the full-width bands further down."
                actions={
                    <Button asChild>
                        <Link to={paths.admin.heroBannerCreate}>
                            <Plus />
                            Add Hero/Banner
                        </Link>
                    </Button>
                }
            />

            {error ? (
                <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription className="flex flex-wrap items-center gap-3">
                        {error}
                        <Button type="button" variant="outline" size="sm" onClick={retry}>
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
                            placeholder="Heading or label"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </Field>

                    <Field label="Section type" htmlFor={sectionFilterId}>
                        <SelectField
                            id={sectionFilterId}
                            value={section}
                            onChange={setSection}
                            options={[
                                { value: '', label: 'All sections' },
                                ...(choices?.sections ?? []).map((choice) => ({
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
                            onChange={setStatus}
                            options={[
                                { value: '', label: 'Any status' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
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
                ) : visible.length === 0 ? (
                    <EmptyState isFiltered={isFiltered} onClear={clearFilters} />
                ) : (
                    <>
                        {/* The table scrolls inside its own box rather than
                            pushing the page sideways on a narrow screen. */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[64rem] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left">
                                        <Th className="w-24">Preview</Th>
                                        <Th>Heading</Th>
                                        <Th className="w-28">Section</Th>
                                        <Th className="w-28">Status</Th>
                                        <Th className="w-20">Order</Th>
                                        <Th className="w-32">Created</Th>
                                        <Th className="w-40 text-right">Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((band) => (
                                        <tr
                                            key={band.id}
                                            className="border-b border-border last:border-0 hover:bg-accent/40"
                                        >
                                            <Td>
                                                <Thumbnail
                                                    url={band.media_url}
                                                    alt={band.heading}
                                                />
                                            </Td>
                                            <Td>
                                                <Link
                                                    to={heroBannerEditPath(band.id)}
                                                    className="font-medium text-foreground hover:underline"
                                                >
                                                    {band.heading}
                                                </Link>
                                                {band.label ? (
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {band.label}
                                                    </p>
                                                ) : null}
                                            </Td>
                                            <Td>
                                                <Pill>{band.section_type}</Pill>
                                            </Td>
                                            <Td>
                                                <Status active={band.is_active} />
                                            </Td>
                                            <Td className="tabular-nums">{band.display_order}</Td>
                                            <Td className="text-muted-foreground">
                                                {formatDate(band.created_at)}
                                            </Td>
                                            <Td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <IconAction
                                                        icon={ExternalLink}
                                                        label="View on the homepage"
                                                        href={paths.home}
                                                    />
                                                    <IconAction
                                                        icon={Pencil}
                                                        label={`Edit ${band.heading}`}
                                                        to={heroBannerEditPath(band.id)}
                                                    />
                                                    <IconAction
                                                        icon={band.is_active ? EyeOff : Eye}
                                                        label={
                                                            band.is_active
                                                                ? `Hide ${band.heading} from the homepage`
                                                                : `Show ${band.heading} on the homepage`
                                                        }
                                                        disabled={busyId === band.id}
                                                        onClick={() => void toggleActive(band)}
                                                    />
                                                    <IconAction
                                                        icon={Trash2}
                                                        label={`Remove ${band.heading}`}
                                                        disabled={busyId === band.id}
                                                        onClick={() => setPendingRemoval(band)}
                                                    />
                                                </div>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                            Showing {visible.length} of {bands.length}{' '}
                            {bands.length === 1 ? 'band' : 'bands'}
                        </div>
                    </>
                )}
            </Card>

            <ConfirmDialog
                open={pendingRemoval !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingRemoval(null);
                }}
                title="Remove this band?"
                description={
                    pendingRemoval
                        ? `“${pendingRemoval.heading}” will be taken off the homepage and its file deleted. This cannot be undone.`
                        : ''
                }
                confirmLabel="Remove"
                onConfirm={() => {
                    const band = pendingRemoval;
                    setPendingRemoval(null);
                    if (band) void remove(band);
                }}
            />
        </div>
    );
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
    return (
        <div className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">
                {isFiltered ? 'No band matches that.' : 'No hero slides or banners yet.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
                {isFiltered
                    ? 'Try a different word, or clear the filters.'
                    : 'Add one and it appears on the homepage in the order you give it.'}
            </p>
            {isFiltered ? (
                <Button type="button" variant="outline" className="mt-4" onClick={onClear}>
                    Clear filters
                </Button>
            ) : (
                <Button asChild className="mt-4">
                    <Link to={paths.admin.heroBannerCreate}>
                        <Plus />
                        Add Hero/Banner
                    </Link>
                </Button>
            )}
        </div>
    );
}

/** One fixed box, so every row keeps its height. */
function Thumbnail({ url, alt }: { url: string; alt: string }) {
    return (
        <img
            className="aspect-4/3 w-20 rounded-md border border-border object-cover"
            src={url}
            alt={alt}
            loading="lazy"
        />
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
        <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
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

function formatDate(value: string | null): string {
    if (!value) return '—';

    return new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** A whole band as the form sends it, with one field changed. */
function asInput(band: HeroBanner, changes: { is_active: boolean }) {
    return {
        section_type: band.section_type,
        label: band.label ?? '',
        heading: band.heading,
        description: band.description ?? '',
        button_text: band.button_text ?? '',
        button_url: band.button_url ?? '',
        caption_label: band.caption_label ?? '',
        caption_heading: band.caption_heading ?? '',
        caption_text: band.caption_text ?? '',
        caption_button_text: band.caption_button_text ?? '',
        caption_button_url: band.caption_button_url ?? '',
        display_order: band.display_order,
        ...changes,
    };
}
