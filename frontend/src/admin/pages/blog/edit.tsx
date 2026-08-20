'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { MetaBadge } from '@/admin/components/meta-badge';
import { getPost, listPosts, updatePost } from '@/admin/features/blog/blog-api';
import { BlogForm } from '@/admin/features/blog/blog-form';
import { toInput } from '@/admin/features/blog/defaults';
import type { BlogChoices, BlogInput, BlogPost } from '@/admin/features/blog/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * Editing a journal post.
 *
 * The same form as writing one, filled in — including the featured image
 * already on it, shown as it is.
 */
export default function AdminBlogEditPage() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const id = Number(postId);

    const [post, setPost] = useState<BlogPost | null>(null);
    const [choices, setChoices] = useState<BlogChoices | null>(null);

    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const load = useCallback(
        () =>
            Promise.all([getPost(id), listPosts({ page: 1 })])
                .then(([found, list]) => {
                    setError(null);
                    setPost(found);
                    setChoices({
                        statuses: list.meta.statuses,
                        categories: list.meta.categories,
                        authors: list.meta.authors,
                    });
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [id],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: BlogInput, file: File | null) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await updatePost(id, input, file);

            void navigate(paths.admin.blog, {
                state: { notice: `“${saved.title}” has been saved.` },
            });
        } catch (problem) {
            const normalized = normalizeError(problem);
            setError(normalized.message);
            setFieldErrors(normalized.fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    const isReady = post !== null && choices !== null;

    return (
        <FormPage
            breadcrumbs={[
                { label: 'Blog', href: paths.admin.blog },
                { label: post?.title ?? 'Edit' },
            ]}
            title="Edit post"
            error={isReady ? error : null}
            meta={
                post ? (
                    <>
                        <MetaBadge tone={post.is_live ? 'active' : 'muted'}>
                            {post.status_label}
                        </MetaBadge>
                        {post.category ? <MetaBadge>{post.category}</MetaBadge> : null}
                        <MetaBadge>{post.reading_minutes} min read</MetaBadge>
                        {post.is_featured ? <MetaBadge tone="active">Featured</MetaBadge> : null}
                    </>
                ) : null
            }
        >
            {isLoading ? (
                <FormSkeleton />
            ) : post && choices ? (
                <BlogForm
                    initial={toInput(post)}
                    existing={post}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Save changes"
                    onSubmit={(input, file) => void save(input, file)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'That post could not be found.'}
                    backHref={paths.admin.blog}
                    backLabel="Back to Blog"
                    onRetry={() => {
                        setLoading(true);
                        void load();
                    }}
                />
            )}
        </FormPage>
    );
}
