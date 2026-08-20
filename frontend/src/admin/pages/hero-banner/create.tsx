'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { BandForm } from '@/admin/features/hero-banners/band-form';
import { blankBand } from '@/admin/features/hero-banners/defaults';
import { createHeroBanner, listHeroBanners } from '@/admin/features/hero-banners/hero-banners-api';
import type { HeroBannerChoices, HeroBannerInput } from '@/admin/features/hero-banners/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * Adding a hero slide or a banner band.
 *
 * A page of its own rather than a panel on the list: adding one is a piece of
 * work with a beginning and an end, and it deserves an address an editor can
 * return to, share, or reload without losing what they were doing.
 */
export default function AdminHeroBannerCreatePage() {
    const navigate = useNavigate();

    const [choices, setChoices] = useState<HeroBannerChoices | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    /* The sections and media types come from the server, so the words on this
       form are the same ones the list shows. */
    const load = useCallback(
        () =>
            listHeroBanners()
                .then((response) => {
                    setError(null);
                    setChoices(response.meta);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: HeroBannerInput, file: File | null) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await createHeroBanner(input, file);

            /* The confirmation belongs on the list, where the new band is now
               visible — not on a form the editor has already left. */
            void navigate(paths.admin.heroBanners, {
                state: { notice: `“${saved.heading}” has been added to the homepage.` },
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
            breadcrumbs={[
                { label: 'Hero & Banner', href: paths.admin.heroBanners },
                { label: 'Add' },
            ]}
            title="Add Hero/Banner"
            description="A slide for the top of the homepage, or a full-width band further down."
            error={choices ? error : null}
        >
            {isLoading ? (
                <FormSkeleton />
            ) : choices ? (
                <BandForm
                    initial={blankBand}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Add to the homepage"
                    onSubmit={(input, file) => void save(input, file)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'This form could not be loaded.'}
                    backHref={paths.admin.heroBanners}
                    backLabel="Back to Hero & Banner"
                    onRetry={() => {
                        setLoading(true);
                        void load();
                    }}
                />
            )}
        </FormPage>
    );
}
