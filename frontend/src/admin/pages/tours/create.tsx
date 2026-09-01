'use client';

import { useState } from 'react';
import { useNavigate } from '@/shared/router';

import { FormPage } from '@/admin/components/form-page';
import { blankTour } from '@/admin/features/tours/defaults';
import { TourForm } from '@/admin/features/tours/tour-form';
import { createTour } from '@/admin/features/tours/tours-api';
import type { TourInput } from '@/admin/features/tours/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * Adding a tour.
 *
 * Nothing is fetched before the form appears — unlike the modules with a tour
 * picker in them, this one has no choices to offer. So there is no loading
 * state and no failure state to reach: the form is ready as soon as the page
 * is.
 */
export default function AdminTourCreatePage() {
    const navigate = useNavigate();

    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const save = async (input: TourInput) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await createTour(input);

            void navigate(paths.admin.tours, {
                state: { notice: `“${saved.tour_name}” has been added.` },
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
            breadcrumbs={[{ label: 'Tours', href: paths.admin.tours }, { label: 'Add' }]}
            title="Add tour"
            description="The CRM's record of one group tour."
            error={error}
        >
            <TourForm
                initial={blankTour}
                isSaving={isSaving}
                fieldErrors={fieldErrors}
                submitLabel="Add tour"
                onSubmit={(input) => void save(input)}
            />
        </FormPage>
    );
}
