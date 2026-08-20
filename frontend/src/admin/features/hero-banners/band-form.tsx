import { useId, useState } from 'react';

import { AdvancedSettings } from '@/admin/components/advanced-settings';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormGrid, FormLayout, FormSection } from '@/admin/components/form-section';
import { SelectField } from '@/admin/components/select-field';
import { ToggleField } from '@/admin/components/toggle-field';
import { FileUploadField } from '@/admin/components/file-upload-field';
import type {
    HeroBannerChoices,
    HeroBannerInput,
    SectionType,
} from '@/admin/features/hero-banners/types';
import { paths } from '@/routes/paths';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

type BandFormProps = {
    initial: HeroBannerInput;
    /** The picture already on the homepage, on the edit screen. */
    existingMedia?: string | null;
    choices: HeroBannerChoices;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    submitLabel: string;
    onSubmit: (input: HeroBannerInput, file: File | null) => void;
};

/**
 * The band form, shared by adding one and changing one.
 *
 * The wide column is the band itself, read top to bottom in the order the work
 * happens: which band of the homepage this is, what it shows, what it says, and
 * where its button goes. The narrow one holds who can see it. Which band and
 * which kind of media stay at the top of the wide column rather than moving to
 * the settings beside it — the media type decides what the upload under it will
 * accept, and a control should sit next to what it governs.
 *
 * The display order is not offered up front. It has a sensible value, most
 * bands never need it changed, and a field an editor has to skip is a field
 * that slowed them down.
 */
export function BandForm({
    initial,
    existingMedia = null,
    choices,
    isSaving,
    fieldErrors,
    submitLabel,
    onSubmit,
}: BandFormProps) {
    const [form, setForm] = useState<HeroBannerInput>(initial);
    const [file, setFile] = useState<File | null>(null);

    const sectionId = useId();
    const fileId = useId();
    const labelId = useId();
    const headingId = useId();
    const descriptionId = useId();
    const buttonTextId = useId();
    const buttonUrlId = useId();
    const captionLabelId = useId();
    const captionHeadingId = useId();
    const captionTextId = useId();
    const captionButtonTextId = useId();
    const captionButtonUrlId = useId();
    const orderId = useId();
    const activeId = useId();

    const change = <FieldName extends keyof HeroBannerInput>(
        field: FieldName,
        value: HeroBannerInput[FieldName],
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
                            title="Placement"
                            description="Which band of the homepage this is, and what it shows behind the words."
                        >
                            <Field
                                label="Section type"
                                htmlFor={sectionId}
                                error={fieldErrors.section_type}
                                required
                            >
                                <SelectField
                                    id={sectionId}
                                    value={form.section_type}
                                    disabled={isSaving}
                                    invalid={Boolean(fieldErrors.section_type)}
                                    options={choices.sections.map((section) => ({
                                        value: section.value,
                                        label: section.label,
                                        description: section.description,
                                    }))}
                                    onChange={(value) =>
                                        change('section_type', value as SectionType)
                                    }
                                />
                            </Field>
                        </FormSection>

                        <FormSection
                            title="Media"
                            description="The picture shown full width behind this band's words."
                        >
                            <FileUploadField
                                id={fileId}
                                label="Picture"
                                kind="image"
                                file={file}
                                onFileChange={setFile}
                                existingUrl={existingMedia}
                                existingCaption="Showing on the homepage now"
                                required={!existingMedia}
                                hint={`JPG, PNG or WebP, up to 10 MB.${existingMedia ? ' Leave empty to keep the current picture.' : ''}`}
                                error={fieldErrors.media_file}
                                disabled={isSaving}
                            />
                        </FormSection>

                        <FormSection
                            title="Content"
                            description="What a traveller reads over the media."
                        >
                            <Field
                                label="Label"
                                htmlFor={labelId}
                                error={fieldErrors.label}
                                hint="The small line above the heading. Leave empty for none."
                            >
                                <Input
                                    id={labelId}
                                    value={form.label}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.label)}
                                    onChange={(event) => change('label', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Heading"
                                htmlFor={headingId}
                                error={fieldErrors.heading}
                                required
                                hint="Wrap a word in *asterisks* to set it in the brand italic."
                            >
                                <Input
                                    id={headingId}
                                    value={form.heading}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.heading)}
                                    onChange={(event) => change('heading', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Description"
                                htmlFor={descriptionId}
                                error={fieldErrors.description}
                            >
                                <Textarea
                                    id={descriptionId}
                                    value={form.description}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.description)}
                                    onChange={(event) => change('description', event.target.value)}
                                />
                            </Field>
                        </FormSection>

                        {/*
                         * The words printed over the photograph. A banner has
                         * no overlay, so the section is not offered for one —
                         * five fields that could never appear anywhere would
                         * be five fields an editor has to learn to ignore.
                         */}
                        {form.section_type === 'hero' ? (
                            <FormSection
                                title="Caption over the picture"
                                description="The small block of words on the photograph itself. Leave empty for none."
                            >
                                <Field
                                    label="Badge"
                                    htmlFor={captionLabelId}
                                    error={fieldErrors.caption_label}
                                    hint="The small pill above the caption. Repeated under the slider."
                                >
                                    <Input
                                        id={captionLabelId}
                                        value={form.caption_label}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.caption_label)}
                                        onChange={(event) =>
                                            change('caption_label', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Caption heading"
                                    htmlFor={captionHeadingId}
                                    error={fieldErrors.caption_heading}
                                >
                                    <Input
                                        id={captionHeadingId}
                                        value={form.caption_heading}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.caption_heading)}
                                        onChange={(event) =>
                                            change('caption_heading', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Caption text"
                                    htmlFor={captionTextId}
                                    error={fieldErrors.caption_text}
                                >
                                    <Textarea
                                        id={captionTextId}
                                        value={form.caption_text}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.caption_text)}
                                        onChange={(event) =>
                                            change('caption_text', event.target.value)
                                        }
                                    />
                                </Field>

                                <FormGrid>
                                    <Field
                                        label="Link text"
                                        htmlFor={captionButtonTextId}
                                        error={fieldErrors.caption_button_text}
                                    >
                                        <Input
                                            id={captionButtonTextId}
                                            value={form.caption_button_text}
                                            disabled={isSaving}
                                            aria-invalid={Boolean(fieldErrors.caption_button_text)}
                                            onChange={(event) =>
                                                change('caption_button_text', event.target.value)
                                            }
                                        />
                                    </Field>

                                    <Field
                                        label="Link address"
                                        htmlFor={captionButtonUrlId}
                                        error={fieldErrors.caption_button_url}
                                        hint="For example #trips."
                                    >
                                        <Input
                                            id={captionButtonUrlId}
                                            value={form.caption_button_url}
                                            disabled={isSaving}
                                            aria-invalid={Boolean(fieldErrors.caption_button_url)}
                                            onChange={(event) =>
                                                change('caption_button_url', event.target.value)
                                            }
                                        />
                                    </Field>
                                </FormGrid>
                            </FormSection>
                        ) : null}

                        <FormSection
                            title="Button"
                            description="Optional. A button needs both its words and its address, or neither."
                        >
                            <FormGrid>
                                <Field
                                    label="Button text"
                                    htmlFor={buttonTextId}
                                    error={fieldErrors.button_text}
                                >
                                    <Input
                                        id={buttonTextId}
                                        value={form.button_text}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.button_text)}
                                        onChange={(event) =>
                                            change('button_text', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Button URL"
                                    htmlFor={buttonUrlId}
                                    error={fieldErrors.button_url}
                                    hint="For example #trips."
                                >
                                    <Input
                                        id={buttonUrlId}
                                        value={form.button_url}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.button_url)}
                                        onChange={(event) =>
                                            change('button_url', event.target.value)
                                        }
                                    />
                                </Field>
                            </FormGrid>
                        </FormSection>
                    </>
                }
                aside={
                    <>
                        <FormSection
                            title="Visibility"
                            description="Who can see this band, and where it sits."
                        >
                            <ToggleField
                                id={activeId}
                                label="Active"
                                description={
                                    form.is_active
                                        ? 'Travellers can see this band on the homepage.'
                                        : 'Hidden from the homepage until you switch this on.'
                                }
                                checked={form.is_active}
                                disabled={isSaving}
                                onChange={(checked) => change('is_active', checked)}
                            />

                            {/* A problem with the order has to open the section holding it,
                    or it would be reported somewhere nobody is looking. */}
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
                cancelHref={paths.admin.heroBanners}
                submitLabel={submitLabel}
                isSaving={isSaving}
            />
        </form>
    );
}
