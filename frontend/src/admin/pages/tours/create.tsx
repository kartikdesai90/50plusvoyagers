'use client';

import { useState } from 'react';
import { useNavigate } from '@/shared/router';

import { FormPage } from '@/admin/components/form-page';
import { blankTour } from '@/admin/features/tours/defaults';
import { TourForm } from '@/admin/features/tours/tour-form';
import { createTour, type TourFiles } from '@/admin/features/tours/tours-api';
import type { TourInput } from '@/admin/features/tours/types';
import { paths, tourEditPath } from '@/routes/paths';
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

    const save = async (input: TourInput, files: TourFiles) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await createTour(input, files);

            /*
             * On to the new tour, not back to the list.
             *
             * The other modules return to their list because a record is
             * finished when it is saved — a photograph, a quote, a banner is
             * one form and done. A tour is not: what has just been created is
             * the CRM's five fields and a heading, and the trip itself — the
             * day-by-day, the highlights, what the price covers — is written on
             * the edit screen's Content tab, which does not exist until the
             * tour has an id.
             *
             * So the list was a dead end that every editor had to walk back
             * from. This lands them where the work continues, and says which
             * tour they are now looking at.
             */
            void navigate(tourEditPath(saved.id), {
                state: { notice: `“${saved.tour_name}” has been added. Now write its page.` },
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
                onSubmit={(input, files) => void save(input, files)}
            />
        </FormPage>
    );
}
