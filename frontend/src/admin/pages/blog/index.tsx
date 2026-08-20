'use client';

import { AlertCircle, CheckCircle2, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useLocation } from '@/shared/router';

import { ConfirmDialog } from '@/admin/components/confirm-dialog';
import { Field } from '@/admin/components/form-section';
import { IconAction } from '@/admin/components/icon-action';
import { PageHeader } from '@/admin/components/page-header';
import { SelectField } from '@/admin/components/select-field';
import { deletePost, listPosts, updatePost } from '@/admin/features/blog/blog-api';
import { toInput } from '@/admin/features/blog/defaults';
import type { BlogChoices, BlogPost } from '@/admin/features/blog/types';
import { blogEditPath, paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * The journal, as staff see it.
 *
 * Drafts and published posts in one list rather than two tabs: an editor's
 * question is almost always "where is that piece", and splitting the answer in
 * two by a state they may not remember makes it harder to answer.
 */
export default function AdminBlogIndexPage() {
    const location = useLocation();

    const searchId = useId();
    const statusFilterId = useId();
    const categoryFilterId = useId();
    const featuredFilterId = useId();
    const fromId = useId();
    const toId = useId();

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [choices, setChoices] = useState<BlogChoices | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState('');
    const [featured, setFeatured] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(
        (location.state as { notice?: string } | null)?.notice ?? null,
    );
    const [busyId, setBusyId] = useState<number | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<BlogPost | null>(null);

    const load = useCallback(
        () =>
            listPosts({ search, status, category, featured, from, to, page })
                .then((response) => {
                    setError(null);
                    setPosts(response.data);
                    setChoices({
                        statuses: response.meta.statuses,
                        categories: response.meta.categories,
                        authors: response.meta.authors,
                    });
                    setLastPage(response.meta.last_page);
                    setTotal(response.meta.total);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [search, status, category, featured, from, to, page],
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

    const toggleFeatured = async (post: BlogPost) => {
        setBusyId(post.id);
        setError(null);
        setNotice(null);

        try {
            await updatePost(post.id, { ...toInput(post), is_featured: !post.is_featured }, null);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (post: BlogPost) => {
        setBusyId(post.id);
        setError(null);
        setNotice(null);

        try {
            await deletePost(post.id);
            setNotice(`“${post.title}” has been removed from the journal.`);
            await load();
        } catch (problem) {
            setError(normalizeError(problem).message);
        } finally {
            setBusyId(null);
        }
    };

    const isFiltered =
        search.trim() !== '' ||
        status !== '' ||
        category !== '' ||
        featured !== '' ||
        from !== '' ||
        to !== '';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Blog"
                description="The journal — drafts, scheduled posts and everything already published."
                actions={
                    <Button asChild>
                        <Link to={paths.admin.blogCreate}>
                            <Plus />
                            Write a post
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
                <div className="grid gap-4 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Field label="Search" htmlFor={searchId}>
                        <Input
                            id={searchId}
                            value={search}
                            placeholder="Title or description"
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
                                ...(choices?.statuses ?? []).map((choice) => ({
                                    value: choice.value,
                                    label: choice.label,
                                    description: choice.description,
                                })),
                            ]}
                        />
                    </Field>

                    <Field label="Category" htmlFor={categoryFilterId}>
                        <SelectField
                            id={categoryFilterId}
                            value={category}
                            onChange={(value) => changeFilter(() => setCategory(value))}
                            options={[
                                { value: '', label: 'All categories' },
                                ...(choices?.categories ?? []).map((name) => ({
                                    value: name,
                                    label: name,
                                })),
                            ]}
                        />
                    </Field>

                    <Field label="Featured" htmlFor={featuredFilterId}>
                        <SelectField
                            id={featuredFilterId}
                            value={featured}
                            onChange={(value) => changeFilter(() => setFeatured(value))}
                            options={[
                                { value: '', label: 'Any' },
                                { value: '1', label: 'Featured only' },
                                { value: '0', label: 'Not featured' },
                            ]}
                        />
                    </Field>

                    <Field label="Published from" htmlFor={fromId}>
                        <Input
                            id={fromId}
                            type="date"
                            value={from}
                            onChange={(event) => changeFilter(() => setFrom(event.target.value))}
                        />
                    </Field>

                    <Field label="Published to" htmlFor={toId}>
                        <Input
                            id={toId}
                            type="date"
                            value={to}
                            onChange={(event) => changeFilter(() => setTo(event.target.value))}
                        />
                    </Field>
                </div>

                {isLoading ? (
                    <div className="flex flex-col gap-3 p-4">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Skeleton key={index} className="h-16 w-full" />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <EmptyState
                        isFiltered={isFiltered}
                        onClear={() =>
                            changeFilter(() => {
                                setSearch('');
                                setStatus('');
                                setCategory('');
                                setFeatured('');
                                setFrom('');
                                setTo('');
                            })
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[68rem] border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left">
                                        <Th className="w-28">Image</Th>
                                        <Th>Title</Th>
                                        <Th className="w-32">Category</Th>
                                        <Th className="w-32">Author</Th>
                                        <Th className="w-28">Status</Th>
                                        <Th className="w-32">Published</Th>
                                        <Th className="w-24">Featured</Th>
                                        <Th className="w-32 text-right">Actions</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map((post) => (
                                        <tr
                                            key={post.id}
                                            className="border-b border-border last:border-0 hover:bg-accent/40"
                                        >
                                            <Td>
                                                {post.image_url ? (
                                                    <img
                                                        src={post.image_url}
                                                        alt={post.title}
                                                        className="aspect-4/3 w-20 rounded-md border border-border object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="aspect-4/3 w-20 rounded-md bg-muted" />
                                                )}
                                            </Td>
                                            <Td>
                                                <Link
                                                    to={blogEditPath(post.id)}
                                                    className="font-medium text-foreground hover:underline"
                                                >
                                                    {post.title}
                                                </Link>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    /{post.slug} · {post.reading_minutes} min read
                                                </p>
                                            </Td>
                                            <Td>
                                                {post.category ? (
                                                    <Pill>{post.category}</Pill>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </Td>
                                            {/* The byline a reader sees, which is the
                                                credited writer where there is one and
                                                the staff member who filed it otherwise. */}
                                            <Td className="text-muted-foreground">{post.byline}</Td>
                                            <Td>
                                                <Status post={post} />
                                            </Td>
                                            <Td className="text-muted-foreground">
                                                {formatDate(post.published_at)}
                                            </Td>
                                            <Td>
                                                {post.is_featured ? (
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
                                            <Td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <IconAction
                                                        icon={Pencil}
                                                        label={`Edit ${post.title}`}
                                                        to={blogEditPath(post.id)}
                                                    />
                                                    <IconAction
                                                        icon={Star}
                                                        label={
                                                            post.is_featured
                                                                ? 'Remove from featured'
                                                                : 'Mark as featured'
                                                        }
                                                        disabled={busyId === post.id}
                                                        onClick={() => void toggleFeatured(post)}
                                                    />
                                                    <IconAction
                                                        icon={Trash2}
                                                        label={`Remove ${post.title}`}
                                                        disabled={busyId === post.id}
                                                        onClick={() => setPendingRemoval(post)}
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
                                {total} {total === 1 ? 'post' : 'posts'}
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
                title="Remove this post?"
                description={
                    pendingRemoval
                        ? `“${pendingRemoval.title}” will be removed from the journal, along with its featured image. This cannot be undone.`
                        : ''
                }
                onConfirm={() => {
                    const post = pendingRemoval;
                    setPendingRemoval(null);
                    if (post) void remove(post);
                }}
            />
        </div>
    );
}

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
    return (
        <div className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">
                {isFiltered ? 'No post matches that.' : 'Nothing written yet.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
                {isFiltered
                    ? 'Try a different word, or clear the filters.'
                    : 'Write the first post and it will appear here.'}
            </p>
            {isFiltered ? (
                <Button type="button" variant="outline" className="mt-4" onClick={onClear}>
                    Clear filters
                </Button>
            ) : (
                <Button asChild className="mt-4">
                    <Link to={paths.admin.blogCreate}>
                        <Plus />
                        Write a post
                    </Link>
                </Button>
            )}
        </div>
    );
}

/** Draft, Scheduled or Published — the server has already decided which. */
function Status({ post }: { post: BlogPost }) {
    const live = post.is_live;

    return (
        <span
            className={
                live
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand'
                    : 'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
            }
        >
            <span
                className={`size-1.5 rounded-full ${live ? 'bg-brand' : 'bg-muted-foreground/60'}`}
                aria-hidden="true"
            />
            {post.status_label}
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

function formatDate(value: string | null): string {
    if (!value) return '—';

    return new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
