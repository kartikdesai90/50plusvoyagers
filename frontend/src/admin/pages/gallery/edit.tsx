'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { MetaBadge } from '@/admin/components/meta-badge';
import { toInput } from '@/admin/features/gallery/defaults';
import {
    getGalleryItem,
    listGallery,
    updateGalleryItem,
} from '@/admin/features/gallery/gallery-api';
import { GalleryForm } from '@/admin/features/gallery/gallery-form';
import type { GalleryChoices, GalleryInput, GalleryItem } from '@/admin/features/gallery/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * Changing a photograph.
 *
 * The same form as adding one, filled in — including the picture already in the
 * gallery, shown as it is. An editor replacing it should be looking at the one
 * they are replacing while they do it.
 */
export default function AdminGalleryEditPage() {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const id = Number(itemId);

    const [item, setItem] = useState<GalleryItem | null>(null);
    const [choices, setChoices] = useState<GalleryChoices | null>(null);

    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const load = useCallback(
        () =>
            Promise.all([getGalleryItem(id), listGallery({ page: 1 })])
                .then(([found, list]) => {
                    setError(null);
                    setItem(found);
                    setChoices({ tours: list.meta.tours });
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [id],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: GalleryInput, file: File | null) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await updateGalleryItem(id, input, file);

            void navigate(paths.admin.gallery, {
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

    const isReady = item !== null && choices !== null;

    return (
        <FormPage
            breadcrumbs={[
                { label: 'Gallery', href: paths.admin.gallery },
                { label: item?.title ?? 'Edit' },
            ]}
            title="Edit photograph"
            error={isReady ? error : null}
            meta={
                item ? (
                    <>
                        <MetaBadge tone={item.is_active ? 'active' : 'muted'}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </MetaBadge>
                        {item.is_featured ? <MetaBadge tone="active">Featured</MetaBadge> : null}
                    </>
                ) : null
            }
        >
            {isLoading ? (
                <FormSkeleton />
            ) : item && choices ? (
                <GalleryForm
                    initial={toInput(item)}
                    existing={item}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Save changes"
                    onSubmit={(input, file) => void save(input, file)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'That photograph could not be found.'}
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
