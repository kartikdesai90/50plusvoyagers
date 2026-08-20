import { useId, useState } from 'react';

import { AdvancedSettings } from '@/admin/components/advanced-settings';
import { FileUploadField } from '@/admin/components/file-upload-field';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormLayout, FormSection } from '@/admin/components/form-section';
import { SelectField } from '@/admin/components/select-field';
import { ToggleField } from '@/admin/components/toggle-field';
import type { GalleryChoices, GalleryInput, GalleryItem } from '@/admin/features/gallery/types';
import { paths } from '@/routes/paths';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type GalleryFormProps = {
    initial: GalleryInput;
    /** What is already stored, on the edit screen. */
    existing?: GalleryItem | null;
    choices: GalleryChoices;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    submitLabel: string;
    onSubmit: (input: GalleryInput, file: File | null) => void;
};

/**
 * The gallery form, shared by adding a photograph and changing one.
 *
 * Short by design: a photograph is a picture, a name for it and a line about
 * it. Anything more would be a form standing between an editor and the one
 * thing they came to do.
 *
 * The wide column is the photograph and what is said about it; the narrow one
 * is who can see it and where it sits. The same split every module uses, so an
 * editor moving between them is never learning a new shape.
 */
export function GalleryForm({
    initial,
    existing = null,
    choices,
    isSaving,
    fieldErrors,
    submitLabel,
    onSubmit,
}: GalleryFormProps) {
    const [form, setForm] = useState<GalleryInput>(initial);
    const [file, setFile] = useState<File | null>(null);

    const titleId = useId();
    const captionId = useId();
    const imageId = useId();
    const tourFieldId = useId();
    const orderId = useId();
    const activeId = useId();
    const featuredId = useId();

    const change = <FieldName extends keyof GalleryInput>(
        field: FieldName,
        value: GalleryInput[FieldName],
    ) => setForm((current) => ({ ...current, [field]: value }));

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) onSubmit(form, file);
            }}
            noValidate
        >
            <FormLayout
                main={
                    <>
                        <FormSection
                            title="Photograph"
                            description="The picture itself, and what it is called."
                        >
                            <FileUploadField
                                id={imageId}
                                label="Image"
                                kind="image"
                                file={file}
                                onFileChange={setFile}
                                existingUrl={existing?.image_url ?? null}
                                existingCaption="In the gallery now"
                                hint={`JPG, PNG or WebP, up to 10 MB.${existing ? ' Leave empty to keep the current picture.' : ''}`}
                                required={!existing}
                                error={fieldErrors.image_file}
                                disabled={isSaving}
                            />

                            <Field
                                label="Title"
                                htmlFor={titleId}
                                error={fieldErrors.title}
                                required
                            >
                                <Input
                                    id={titleId}
                                    value={form.title}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.title)}
                                    onChange={(event) => change('title', event.target.value)}
                                />
                            </Field>
                        </FormSection>

                        <FormSection
                            title="Description"
                            description="What a visitor reads, and what a screen reader announces."
                        >
                            <Field
                                label="Caption"
                                htmlFor={captionId}
                                error={fieldErrors.caption}
                                hint="Shown under the photograph. A sentence is plenty."
                            >
                                <Textarea
                                    id={captionId}
                                    value={form.caption}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.caption)}
                                    onChange={(event) => change('caption', event.target.value)}
                                />
                            </Field>
                        </FormSection>
                    </>
                }
                aside={
                    <>
                        {/*
                         * The tour picker appears the day the Tours module does. Until then
                         * there is nothing to choose from, and an empty list is a worse
                         * answer than no field at all.
                         */}
                        {choices.tours.length > 0 ? (
                            <FormSection
                                title="Tour"
                                description="Where this photograph was taken."
                            >
                                <Field
                                    label="Tour"
                                    htmlFor={tourFieldId}
                                    error={fieldErrors.tour_id}
                                >
                                    <SelectField
                                        id={tourFieldId}
                                        value={form.tour_id}
                                        disabled={isSaving}
                                        invalid={Boolean(fieldErrors.tour_id)}
                                        options={[
                                            { value: '', label: 'Not from a particular tour' },
                                            ...choices.tours.map((tour) => ({
                                                value: String(tour.id),
                                                label: tour.name,
                                            })),
                                        ]}
                                        onChange={(value) => change('tour_id', value)}
                                    />
                                </Field>
                            </FormSection>
                        ) : null}

                        <FormSection
                            title="Visibility"
                            description="Who can see this, and where it sits among the others."
                        >
                            <ToggleField
                                id={activeId}
                                label="Active"
                                description={
                                    form.is_active
                                        ? 'Travellers can see this photograph.'
                                        : 'Hidden until you switch this on.'
                                }
                                checked={form.is_active}
                                disabled={isSaving}
                                onChange={(checked) => change('is_active', checked)}
                            />

                            <ToggleField
                                id={featuredId}
                                label="Featured"
                                description="Featured photographs are the ones chosen for the homepage."
                                checked={form.is_featured}
                                disabled={isSaving}
                                onChange={(checked) => change('is_featured', checked)}
                            />

                            <AdvancedSettings forceOpen={Boolean(fieldErrors.display_order)}>
                                <Field
                                    label="Display order"
                                    htmlFor={orderId}
                                    error={fieldErrors.display_order}
                                    hint="Lower numbers appear first."
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
                cancelHref={paths.admin.gallery}
                submitLabel={submitLabel}
                isSaving={isSaving}
            />
        </form>
    );
}
