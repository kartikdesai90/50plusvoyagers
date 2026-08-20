'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { createPost, listPosts } from '@/admin/features/blog/blog-api';
import { BlogForm } from '@/admin/features/blog/blog-form';
import { blankPost } from '@/admin/features/blog/defaults';
import type { BlogChoices, BlogInput } from '@/admin/features/blog/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/** Writing a journal post. */
export default function AdminBlogCreatePage() {
    const navigate = useNavigate();

    const [choices, setChoices] = useState<BlogChoices | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    /* The states, the categories already in use and the staff who could be its
       author all come from the server, so this form and the list agree. */
    const load = useCallback(
        () =>
            listPosts({ page: 1 })
                .then((response) => {
                    setError(null);
                    setChoices({
                        statuses: response.meta.statuses,
                        categories: response.meta.categories,
                        authors: response.meta.authors,
                    });
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: BlogInput, file: File | null) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await createPost(input, file);

            void navigate(paths.admin.blog, {
                state: {
                    notice: saved.is_live
                        ? `“${saved.title}” has been published.`
                        : `“${saved.title}” has been saved as a ${saved.status_label.toLowerCase()}.`,
                },
            });
        } catch (problem) {
            const normalized = normalizeError(problem);
            setError(normalized.message);
            setFieldErrors(normalized.fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    return (
        <FormPage
            breadcrumbs={[{ label: 'Blog', href: paths.admin.blog }, { label: 'Write' }]}
            title="Write a post"
            description="Save it as a draft while you work, and publish it when it is ready."
            error={choices ? error : null}
        >
            {isLoading ? (
                <FormSkeleton />
            ) : choices ? (
                <BlogForm
                    initial={blankPost}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Save post"
                    onSubmit={(input, file) => void save(input, file)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'This form could not be loaded.'}
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
