import { useId, useState } from 'react';

import { AdvancedSettings } from '@/admin/components/advanced-settings';
import { FileUploadField } from '@/admin/components/file-upload-field';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormGrid, FormLayout, FormSection } from '@/admin/components/form-section';
import { SelectField } from '@/admin/components/select-field';
import { ToggleField } from '@/admin/components/toggle-field';
import { noFiles } from '@/admin/features/feedback/defaults';
import type {
    Feedback,
    FeedbackChoices,
    FeedbackFiles,
    FeedbackInput,
    FeedbackType,
} from '@/admin/features/feedback/types';
import { paths } from '@/routes/paths';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type FeedbackFormProps = {
    initial: FeedbackInput;
    /** What is already stored, on the edit screen. */
    existing?: Feedback | null;
    choices: FeedbackChoices;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    submitLabel: string;
    onSubmit: (input: FeedbackInput, files: FeedbackFiles) => void;
};

/**
 * The feedback form, shared by adding one and changing one.
 *
 * The kind is asked first because it decides what the rest of the form is: a
 * written quote wants words, a filmed one wants a film and a still. Showing
 * both sets at once and letting the editor work out which half to fill in is
 * how a form becomes twice as long as the job it is for.
 *
 * The wide column is the testimonial — who said it, and what they said. The
 * narrow one is who can see it. The same split every module uses, so an editor
 * moving between them is never learning a new shape.
 *
 * The traveller's own photograph follows the same rule as the two sections
 * above it, and for the same reason: the toasts band prints it beside a written
 * quote, while a filmed testimonial shows its own still instead. So it is asked
 * for on a written one and not on a film, where it could never appear.
 *
 * The star rating that used to sit beside it is gone — nothing on the site has
 * ever printed one. Its column is untouched: a save no longer mentions it, and
 * the request reads that silence as "leave it alone" rather than as an
 * instruction to erase whatever was already stored.
 */
export function FeedbackForm({
    initial,
    existing = null,
    choices,
    isSaving,
    fieldErrors,
    submitLabel,
    onSubmit,
}: FeedbackFormProps) {
    const [form, setForm] = useState<FeedbackInput>(initial);
    const [files, setFiles] = useState<FeedbackFiles>(noFiles);

    const typeId = useId();
    const nameId = useId();
    const locationId = useId();
    const textId = useId();
    const videoUrlId = useId();
    const videoFileId = useId();
    const thumbnailId = useId();
    const photoId = useId();
    const tourId = useId();
    const orderId = useId();
    const activeId = useId();
    const featuredId = useId();

    const change = <FieldName extends keyof FeedbackInput>(
        field: FieldName,
        value: FeedbackInput[FieldName],
    ) => setForm((current) => ({ ...current, [field]: value }));

    const changeFile = (slot: keyof FeedbackFiles, file: File | null) =>
        setFiles((current) => ({ ...current, [slot]: file }));

    const isVideo = form.type === 'video';

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) onSubmit(form, files);
            }}
            noValidate
        >
            <FormLayout
                main={
                    <>
                        <FormSection
                            title="Basic information"
                            description="Who said it, and how they said it."
                        >
                            <Field
                                label="Feedback type"
                                htmlFor={typeId}
                                error={fieldErrors.type}
                                required
                            >
                                <SelectField
                                    id={typeId}
                                    value={form.type}
                                    disabled={isSaving}
                                    invalid={Boolean(fieldErrors.type)}
                                    options={choices.types.map((type) => ({
                                        value: type.value,
                                        label: type.label,
                                        description: type.description,
                                    }))}
                                    onChange={(value) => change('type', value as FeedbackType)}
                                />
                            </Field>

                            <FormGrid>
                                <Field
                                    label="Customer name"
                                    htmlFor={nameId}
                                    error={fieldErrors.customer_name}
                                    required
                                >
                                    <Input
                                        id={nameId}
                                        value={form.customer_name}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.customer_name)}
                                        onChange={(event) =>
                                            change('customer_name', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Location"
                                    htmlFor={locationId}
                                    error={fieldErrors.customer_location}
                                    hint="Where they are from — for example Bengaluru, India."
                                >
                                    <Input
                                        id={locationId}
                                        value={form.customer_location}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.customer_location)}
                                        onChange={(event) =>
                                            change('customer_location', event.target.value)
                                        }
                                    />
                                </Field>
                            </FormGrid>
                        </FormSection>

                        {isVideo ? (
                            <FormSection
                                title="Video"
                                description="The film, and the still shown before it plays."
                            >
                                <Field
                                    label="Video link"
                                    htmlFor={videoUrlId}
                                    error={fieldErrors.video_url}
                                    hint="Paste a link to the film, or upload the file below."
                                >
                                    <Input
                                        id={videoUrlId}
                                        type="url"
                                        value={form.video_url}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.video_url)}
                                        onChange={(event) =>
                                            change('video_url', event.target.value)
                                        }
                                    />
                                </Field>

                                <FileUploadField
                                    id={videoFileId}
                                    label="Video file"
                                    kind="video"
                                    file={files.video_file}
                                    onFileChange={(file) => changeFile('video_file', file)}
                                    existingUrl={
                                        existing?.video_is_uploaded ? existing.video_source : null
                                    }
                                    existingCaption="Uploaded to this site"
                                    emptyTitle="Drop a video here"
                                    emptyHint="or leave this empty and use the link above"
                                    hint="MP4 or WebM, up to 50 MB. An upload takes the place of the link."
                                    error={fieldErrors.video_file}
                                    disabled={isSaving}
                                />

                                <FileUploadField
                                    id={thumbnailId}
                                    label="Video thumbnail"
                                    kind="image"
                                    file={files.thumbnail_file}
                                    onFileChange={(file) => changeFile('thumbnail_file', file)}
                                    existingUrl={existing?.thumbnail_url ?? null}
                                    hint="The still shown before the film plays. JPG, PNG or WebP."
                                    error={fieldErrors.thumbnail_file}
                                    disabled={isSaving}
                                />
                            </FormSection>
                        ) : (
                            <FormSection
                                title="Feedback"
                                description="What the traveller said, in their words."
                            >
                                <Field
                                    label="Feedback text"
                                    htmlFor={textId}
                                    error={fieldErrors.feedback_text}
                                    required
                                    hint="A short quote reads best — two or three sentences."
                                >
                                    <Textarea
                                        id={textId}
                                        className="min-h-32"
                                        value={form.feedback_text}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.feedback_text)}
                                        onChange={(event) =>
                                            change('feedback_text', event.target.value)
                                        }
                                    />
                                </Field>
                            </FormSection>
                        )}
                        {/*
                         * A written quote only. A film carries its own still,
                         * and the toasts band is the one place this photograph
                         * is ever printed.
                         */}
                        {isVideo ? null : (
                            <FormSection
                                title="Customer"
                                description="The traveller's own photo, shown beside their words."
                            >
                                <FileUploadField
                                    id={photoId}
                                    label="Profile image"
                                    kind="image"
                                    file={files.photo_file}
                                    onFileChange={(file) => changeFile('photo_file', file)}
                                    existingUrl={existing?.photo_url ?? null}
                                    existingCaption="Beside their quote now"
                                    hint="Optional. JPG, PNG or WebP."
                                    error={fieldErrors.photo_file}
                                    disabled={isSaving}
                                />

                                {/*
                                 * The tour picker appears the day the Tours
                                 * module does. Until then there is nothing to
                                 * choose from, and an empty list is a worse
                                 * answer than no field at all.
                                 */}
                                {choices.tours.length > 0 ? (
                                    <Field
                                        label="Tour"
                                        htmlFor={tourId}
                                        error={fieldErrors.tour_id}
                                    >
                                        <SelectField
                                            id={tourId}
                                            value={form.tour_id}
                                            disabled={isSaving}
                                            invalid={Boolean(fieldErrors.tour_id)}
                                            options={[
                                                { value: '', label: 'Not about a particular tour' },
                                                ...choices.tours.map((tour) => ({
                                                    value: String(tour.id),
                                                    label: tour.name,
                                                })),
                                            ]}
                                            onChange={(value) => change('tour_id', value)}
                                        />
                                    </Field>
                                ) : null}
                            </FormSection>
                        )}
                    </>
                }
                aside={
                    <>
                        <FormSection
                            title="Visibility"
                            description="Who can see this, and where it sits among the others."
                        >
                            <ToggleField
                                id={activeId}
                                label="Active"
                                description={
                                    form.is_active
                                        ? 'Travellers can see this testimonial.'
                                        : 'Hidden until you switch this on.'
                                }
                                checked={form.is_active}
                                disabled={isSaving}
                                onChange={(checked) => change('is_active', checked)}
                            />

                            <ToggleField
                                id={featuredId}
                                label="Featured"
                                description="Featured testimonials are the ones chosen for the homepage."
                                checked={form.is_featured}
                                disabled={isSaving}
                                onChange={(checked) => change('is_featured', checked)}
                            />

                            <AdvancedSettings forceOpen={Boolean(fieldErrors.display_order)}>
                                <Field
                                    label="Display order"
                                    htmlFor={orderId}
                                    error={fieldErrors.display_order}
                                    hint="Lower numbers appear first. Leave at 0 unless you need a particular order."
                                    className="max-w-40"
                                >
                                    <Input
                                        id={orderId}
                                        type="number"
                                        min={0}
                                        value={form.display_order}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.display_order)}
                                        onChange={(event) =>
                                            change('display_order', Number(event.target.value) || 0)
                                        }
                                    />
                                </Field>
                            </AdvancedSettings>
                        </FormSection>
                    </>
                }
            />

            <FormActions
                cancelHref={paths.admin.feedback}
                submitLabel={submitLabel}
                isSaving={isSaving}
            />
        </form>
    );
}
