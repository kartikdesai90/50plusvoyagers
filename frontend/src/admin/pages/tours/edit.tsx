'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { toInput } from '@/admin/features/tours/defaults';
import { TourForm } from '@/admin/features/tours/tour-form';
import { getTour, updateTour } from '@/admin/features/tours/tours-api';
import type { Tour, TourInput } from '@/admin/features/tours/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/** Changing a tour. The same form as adding one, filled in. */
export default function AdminTourEditPage() {
    const { tourId } = useParams();
    const navigate = useNavigate();
    const id = Number(tourId);

    const [tour, setTour] = useState<Tour | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const load = useCallback(
        () =>
            getTour(id)
                .then((found) => {
                    setError(null);
                    setTour(found);
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [id],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: TourInput) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await updateTour(id, input);

            void navigate(paths.admin.tours, {
                state: { notice: `“${saved.tour_name}” has been saved.` },
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
                { label: 'Tours', href: paths.admin.tours },
                { label: tour?.tour_name ?? 'Edit' },
            ]}
            title="Edit tour"
            error={tour ? error : null}
        >
            {isLoading ? (
                <FormSkeleton />
            ) : tour ? (
                <TourForm
                    initial={toInput(tour)}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Save changes"
                    onSubmit={(input) => void save(input)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'That tour could not be found.'}
                    backHref={paths.admin.tours}
                    backLabel="Back to Tours"
                    onRetry={() => {
                        setLoading(true);
                        void load();
                    }}
                />
            )}
        </FormPage>
    );
}
