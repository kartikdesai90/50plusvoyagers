'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/shared/router';

import { FormPage, FormSkeleton, LoadFailure } from '@/admin/components/form-page';
import { MetaBadge } from '@/admin/components/meta-badge';
import { toInput } from '@/admin/features/feedback/defaults';
import { getFeedback, listFeedback, updateFeedback } from '@/admin/features/feedback/feedback-api';
import { FeedbackForm } from '@/admin/features/feedback/feedback-form';
import type {
    Feedback,
    FeedbackChoices,
    FeedbackFiles,
    FeedbackInput,
} from '@/admin/features/feedback/types';
import { paths } from '@/routes/paths';
import { normalizeError } from '@/shared/lib/api-error';

/**
 * Changing what a traveller told us.
 *
 * The same form as adding one, filled in — including whatever files are already
 * stored, shown as they are. An editor replacing a photo should be looking at
 * the one they are replacing while they do it.
 */
export default function AdminFeedbackEditPage() {
    const { feedbackId } = useParams();
    const navigate = useNavigate();
    const id = Number(feedbackId);

    const [record, setRecord] = useState<Feedback | null>(null);
    const [choices, setChoices] = useState<FeedbackChoices | null>(null);

    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const load = useCallback(
        () =>
            Promise.all([getFeedback(id), listFeedback({ page: 1 })])
                .then(([found, list]) => {
                    setError(null);
                    setRecord(found);
                    setChoices({ types: list.meta.types, tours: list.meta.tours });
                })
                .catch((problem) => setError(normalizeError(problem).message))
                .finally(() => setLoading(false)),
        [id],
    );

    useEffect(() => {
        void load();
    }, [load]);

    const save = async (input: FeedbackInput, files: FeedbackFiles) => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const saved = await updateFeedback(id, input, files);

            void navigate(paths.admin.feedback, {
                state: { notice: `${saved.customer_name}’s feedback has been saved.` },
            });
        } catch (problem) {
            const normalized = normalizeError(problem);
            setError(normalized.message);
            setFieldErrors(normalized.fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    const isReady = record !== null && choices !== null;

    return (
        <FormPage
            breadcrumbs={[
                { label: 'Feedback', href: paths.admin.feedback },
                { label: record?.customer_name ?? 'Edit' },
            ]}
            title="Edit feedback"
            error={isReady ? error : null}
            meta={
                record ? (
                    <>
                        <MetaBadge>{record.type_label}</MetaBadge>
                        {record.customer_location ? (
                            <MetaBadge>{record.customer_location}</MetaBadge>
                        ) : null}
                        <MetaBadge tone={record.is_active ? 'active' : 'muted'}>
                            {record.is_active ? 'Active' : 'Inactive'}
                        </MetaBadge>
                        {record.is_featured ? <MetaBadge tone="active">Featured</MetaBadge> : null}
                    </>
                ) : null
            }
        >
            {isLoading ? (
                <FormSkeleton />
            ) : record && choices ? (
                <FeedbackForm
                    initial={toInput(record)}
                    existing={record}
                    choices={choices}
                    isSaving={isSaving}
                    fieldErrors={fieldErrors}
                    submitLabel="Save changes"
                    onSubmit={(input, files) => void save(input, files)}
                />
            ) : (
                <LoadFailure
                    message={error ?? 'That feedback could not be found.'}
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
