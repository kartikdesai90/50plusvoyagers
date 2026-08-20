'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { blankGalleryItem } from '@/admin/features/gallery/defaults';
import { createGalleryItem, listGallery } from '@/admin/features/gallery/gallery-api';
import { GalleryForm } from '@/admin/features/gallery/gallery-form';
import type { GalleryChoices, GalleryInput } from '@/admin/features/gallery/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/** Adding a photograph to the gallery. */
export default function AdminGalleryCreatePage() {
    const navigate = useNavigate();

    const [choices, setChoices] = useState<GalleryChoices | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const load = useCallback(
        () =>
            listGallery({ page: 1 })
                .then((response) => {
                    setError(null);
                    setChoices({ tours: response.meta.tours });
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: GalleryInput, file: File | null) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await createGalleryItem(input, file);

            void navigate(paths.admin.gallery, {
                state: { notice: `“${saved.title}” has been added to the gallery.` },
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
            breadcrumbs={[{ label: 'Gallery', href: paths.admin.gallery }, { label: 'Add' }]}
            title="Add photograph"
            description="A picture from the road, with a line about where it was taken."
            error={choices ? error : null}
        >
            {isLoading ? (
                <FormSkeleton />
            ) : choices ? (
                <GalleryForm
                    initial={blankGalleryItem}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Add to the gallery"
                    onSubmit={(input, file) => void save(input, file)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'This form could not be loaded.'}
                    backHref={paths.admin.gallery}
                    backLabel="Back to Gallery"
                    onRetry={() => {
                        setLoading(true);
                        void load();
                    }}
                />
            )}
        </FormPage>
    );
}
