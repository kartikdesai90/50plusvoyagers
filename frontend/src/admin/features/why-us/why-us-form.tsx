import { Link2 } from 'lucide-react';
import { useId, useState } from 'react';

import { FileUploadField } from '@/admin/components/file-upload-field';
import { FormActions } from '@/admin/components/form-actions';
import { Field, FormGrid, FormLayout, FormSection } from '@/admin/components/form-section';
import { IconInput } from '@/admin/components/icon-input';
import { TextListField } from '@/admin/components/text-list-field';
import { noFiles } from '@/admin/features/why-us/defaults';
import type { WhyUsFiles, WhyUsInput, WhyUsSection } from '@/admin/features/why-us/types';
import { paths } from '@/routes/paths';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

/** What the band can show before the list stops being a list. */
const MAX_POINTS = 8;

type WhyUsFormProps = {
    initial: WhyUsInput;
    /** What is already stored, so the picture can be shown as it is. */
    existing: WhyUsSection;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    onSubmit: (input: WhyUsInput, files: WhyUsFiles) => void;
};

/**
 * The homepage's "Why travel with us" band.
 *
 * The wide column is the ticked points and the button under them. The narrow
 * one is the photograph beside them and the words printed over it.
 *
 * The section's heading and the small line over it are not on this form and are
 * not stored: they title the section rather than saying anything that changes,
 * so they live in the component that draws it.
 */
export function WhyUsForm({ initial, existing, isSaving, fieldErrors, onSubmit }: WhyUsFormProps) {
    const [form, setForm] = useState<WhyUsInput>(initial);
    const [files, setFiles] = useState<WhyUsFiles>(noFiles);

    const buttonTextId = useId();
    const buttonUrlId = useId();
    const captionHeadingId = useId();
    const captionTextId = useId();

    const change = <FieldName extends keyof WhyUsInput>(
        field: FieldName,
        value: WhyUsInput[FieldName],
    ) => setForm((current) => ({ ...current, [field]: value }));

    /*
     * A 422 on any row comes back keyed `points.0`, and there is one field for
     * the whole list to report it on. The first message is the one shown —
     * stacking eight of them under one box says less, not more.
     */
    const pointsError =
        fieldErrors.points ??
        Object.entries(fieldErrors).find(([key]) => key.startsWith('points.'))?.[1];

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
                            title="Points"
                            description="The ticked list beside the photograph. Each one gets a tick, in this order."
                        >
                            <TextListField
                                label="Points"
                                addLabel="Add a point"
                                placeholder="Social connection happens naturally"
                                hint={`Up to ${MAX_POINTS}. Empty rows are ignored.`}
                                value={form.points}
                                max={MAX_POINTS}
                                disabled={isSaving}
                                error={pointsError}
                                onChange={(points) => change('points', points)}
                            />
                        </FormSection>

                        <FormSection
                            title="Button"
                            description="Under the points. Fill in both boxes, or leave both empty to draw no button."
                        >
                            <FormGrid>
                                <Field
                                    label="Button text"
                                    htmlFor={buttonTextId}
                                    error={fieldErrors.button_text}
                                >
                                    <Input
                                        id={buttonTextId}
                                        placeholder="See upcoming trips"
                                        value={form.button_text}
                                        disabled={isSaving}
                                        aria-invalid={Boolean(fieldErrors.button_text)}
                                        onChange={(event) =>
                                            change('button_text', event.target.value)
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Button address"
                                    htmlFor={buttonUrlId}
                                    error={fieldErrors.button_url}
                                    hint="A page on the site, or #trips to jump to the calendar."
                                >
                                    <IconInput
                                        icon={Link2}
                                        id={buttonUrlId}
                                        placeholder="#trips"
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
                            title="Photograph"
                            description="Beside the words, on the right of the band."
                        >
                            <FileUploadField
                                id="why-us-image"
                                label="Picture"
                                kind="image"
                                file={files.image_file}
                                onFileChange={(file) =>
                                    setFiles((current) => ({ ...current, image_file: file }))
                                }
                                existingUrl={existing.image_url}
                                existingCaption="On the homepage now"
                                hint="JPG, PNG or WebP, up to 10 MB. Portrait or square works best."
                                error={fieldErrors.image_file}
                                required={!existing.image_url}
                                disabled={isSaving}
                            />
                        </FormSection>

                        <FormSection
                            title="Over the photograph"
                            description="Printed across the bottom of it. Leave both empty for a plain picture."
                        >
                            <Field
                                label="Caption heading"
                                htmlFor={captionHeadingId}
                                error={fieldErrors.caption_heading}
                            >
                                <Input
                                    id={captionHeadingId}
                                    placeholder="Small groups of 12–16"
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
                                hint="One line under it."
                            >
                                <Textarea
                                    id={captionTextId}
                                    value={form.caption_text}
                                    disabled={isSaving}
                                    aria-invalid={Boolean(fieldErrors.caption_text)}
                                    onChange={(event) => change('caption_text', event.target.value)}
                                />
                            </Field>
                        </FormSection>
                    </>
                }
            />

            <FormActions
                cancelHref={paths.admin.dashboard}
                submitLabel="Save this band"
                isSaving={isSaving}
            />
        </form>
    );
}
