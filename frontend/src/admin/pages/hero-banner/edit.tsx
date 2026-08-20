'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { MetaBadge } from '@/admin/components/meta-badge';
import { BandForm } from '@/admin/features/hero-banners/band-form';
import {
    getHeroBanner,
    listHeroBanners,
    updateHeroBanner,
} from '@/admin/features/hero-banners/hero-banners-api';
import type {
    HeroBanner,
    HeroBannerChoices,
    HeroBannerInput,
} from '@/admin/features/hero-banners/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * Changing a hero slide or a banner band.
 *
 * The same form as adding one, filled in — including what is already on the
 * homepage, shown as it is. An editor replacing a picture should be looking at
 * the one they are replacing while they do it.
 */
export default function AdminHeroBannerEditPage() {
    const { bandId } = useParams();
    const navigate = useNavigate();
    const id = Number(bandId);

    const [band, setBand] = useState<HeroBanner | null>(null);
    const [choices, setChoices] = useState<HeroBannerChoices | null>(null);

    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const load = useCallback(
        () =>
            Promise.all([getHeroBanner(id), listHeroBanners()])
                .then(([record, list]) => {
                    setError(null);
                    setBand(record);
                    setChoices(list.meta);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [id],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const retry = () => {
        setLoading(true);
        void load();
    };

    const save = async (input: HeroBannerInput, file: File | null) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await updateHeroBanner(id, input, file);

            void navigate(paths.admin.heroBanners, {
                state: { notice: `“${saved.heading}” has been saved.` },
            });
        } catch (problem) {
            const normalized = normalizeError(problem);
            setError(normalized.message);
            setFieldErrors(normalized.fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    const isReady = band !== null && choices !== null;

    return (
        <FormPage
            breadcrumbs={[
                { label: 'Hero & Banner', href: paths.admin.heroBanners },
                { label: band?.heading ?? 'Edit' },
            ]}
            title="Edit Hero/Banner"
            error={isReady ? error : null}
            /* What this band is, at a glance, before any field is read. */
            meta={
                band ? (
                    <>
                        <MetaBadge>{band.section_label}</MetaBadge>
                        <MetaBadge tone={band.is_active ? 'active' : 'muted'}>
                            {band.is_active ? 'Active' : 'Inactive'}
                        </MetaBadge>
                    </>
                ) : null
            }
        >
            {isLoading ? (
                <FormSkeleton />
            ) : band && choices ? (
                <BandForm
                    initial={{
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
                        is_active: band.is_active,
                        display_order: band.display_order,
                    }}
                    existingMedia={band.media_url || null}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Save changes"
                    onSubmit={(input, file) => void save(input, file)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'That band could not be found.'}
                    backHref={paths.admin.heroBanners}
                    backLabel="Back to Hero & Banner"
                    onRetry={retry}
                />
            )}
        </FormPage>
    );
}
