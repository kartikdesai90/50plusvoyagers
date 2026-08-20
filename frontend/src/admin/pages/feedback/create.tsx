'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { blankFeedback } from '@/admin/features/feedback/defaults';
import { createFeedback, listFeedback } from '@/admin/features/feedback/feedback-api';
import { FeedbackForm } from '@/admin/features/feedback/feedback-form';
import type {
    FeedbackChoices,
    FeedbackFiles,
    FeedbackInput,
} from '@/admin/features/feedback/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * Adding what a traveller told us.
 *
 * A page of its own rather than a panel on the list: it is a piece of work with
 * a beginning and an end, and it deserves an address an editor can return to,
 * share, or reload without losing what they were doing.
 */
export default function AdminFeedbackCreatePage() {
    const navigate = useNavigate();

    const [choices, setChoices] = useState<FeedbackChoices | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    /* The kinds and the tours come from the server, so the words on this form
       are the same ones the list shows. */
    const load = useCallback(
        () =>
            listFeedback({ page: 1 })
                .then((response) => {
                    setError(null);
                    setChoices({ types: response.meta.types, tours: response.meta.tours });
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: FeedbackInput, files: FeedbackFiles) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await createFeedback(input, files);

            void navigate(paths.admin.feedback, {
                state: { notice: `${saved.customer_name}’s feedback has been added.` },
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
            breadcrumbs={[{ label: 'Feedback', href: paths.admin.feedback }, { label: 'Add' }]}
            title="Add feedback"
            description="A written quote, or a film of a traveller saying it."
            error={choices ? error : null}
        >
            {isLoading ? (
                <FormSkeleton />
            ) : choices ? (
                <FeedbackForm
                    initial={blankFeedback}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Add feedback"
                    onSubmit={(input, files) => void save(input, files)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'This form could not be loaded.'}
                    backHref={paths.admin.feedback}
                    backLabel="Back to Feedback"
                    onRetry={() => {
                        setLoading(true);
                        void load();
                    }}
                />
            )}
        </FormPage>
    );
}
