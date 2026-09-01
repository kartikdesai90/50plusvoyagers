import { useId, useState } from 'react';

import { FormActions } from '@/admin/components/form-actions';
import { Field, FormGrid, FormLayout, FormSection } from '@/admin/components/form-section';
import type { TourInput } from '@/admin/features/tours/types';
import { paths } from '@/routes/paths';
import { Input } from '@/shared/ui/input';

type TourFormProps = {
    initial: TourInput;
    isSaving: boolean;
    /** Keyed by the server's field names, so a 422 lands on the field at fault. */
    fieldErrors: Record<string, string>;
    submitLabel: string;
    onSubmit: (input: TourInput) => void;
};

/**
 * The tour form, shared by adding a tour and changing one.
 *
 * One column, not the two-column split the other modules use: there are three
 * fields, and none of them is a visibility switch or an ordering number. A
 * settings rail beside three inputs would be an empty box.
 *
 * Short on purpose, and it will stay short only until the display fields are
 * agreed — a price, a departure date, a duration, a photograph. When they
 * arrive this grows a second column and starts looking like its neighbours.
 */
export function TourForm({ initial, isSaving, fieldErrors, submitLabel, onSubmit }: TourFormProps) {
    const [form, setForm] = useState<TourInput>(initial);

    const codeId = useId();
    const nameId = useId();
    const endDateId = useId();

    const change = <FieldName extends keyof TourInput>(field: FieldName, value: string) =>
        setForm((current) => ({ ...current, [field]: value }));

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) onSubmit(form);
            }}
            noValidate
        >
            <FormLayout
                main={
                    <FormSection
                        title="Tour"
                        description="As the CRM records it. The code is how this tour is matched to its departures."
                    >
                        <FormGrid>
                            <Field
                                label="Tour code"
                                htmlFor={codeId}
                                required
                                error={fieldErrors.tour_code}
                                hint="The CRM's own identifier, e.g. Coorg30052026. No two tours share one."
                            >
                                <Input
                                    id={codeId}
                                    value={form.tour_code}
                                    maxLength={50}
                                    placeholder="Coorg30052026"
                                    autoComplete="off"
                                    onChange={(event) => change('tour_code', event.target.value)}
                                />
                            </Field>

                            <Field
                                label="Ends on"
                                htmlFor={endDateId}
                                error={fieldErrors.end_date}
                                hint="Leave empty if the date is not settled yet."
                            >
                                <Input
                                    id={endDateId}
                                    type="date"
                                    value={form.end_date}
                                    onChange={(event) => change('end_date', event.target.value)}
                                />
                            </Field>
                        </FormGrid>

                        <Field
                            label="Tour name"
                            htmlFor={nameId}
                            required
                            error={fieldErrors.tour_name}
                            hint="What the tour is called in the CRM, e.g. Coorg 30 May - 2 June 2026."
                        >
                            <Input
                                id={nameId}
                                value={form.tour_name}
                                maxLength={200}
                                placeholder="Coorg 30 May - 2 June 2026"
                                onChange={(event) => change('tour_name', event.target.value)}
                            />
                        </Field>
                    </FormSection>
                }
            />

            <FormActions
                cancelHref={paths.admin.tours}
                submitLabel={submitLabel}
                isSaving={isSaving}
            />
        </form>
    );
}
