import { ParagraphListField } from '@/admin/components/paragraph-list-field';
import { FormActions } from '@/admin/components/form-actions';
import { FormSection } from '@/admin/components/form-section';
import { FormTabs } from '@/admin/components/form-tabs';
import { blankLine } from '@/admin/features/tours/content-defaults';
import { ItineraryField } from '@/admin/features/tours/itinerary-field';
import type { LineInput, TourContentInput } from '@/admin/features/tours/content-types';
import { paths } from '@/routes/paths';

type TourContentFormProps = {
    value: TourContentInput;
    isSaving: boolean;
    /** Keyed the way the server keys them — `itinerary.0.heading` — so a 422 lands. */
    fieldErrors: Record<string, string>;
    onChange: (content: TourContentInput) => void;
    onSubmit: () => void;
};

/**
 * Everything a tour page repeats: the day-by-day, the highlights, what the
 * price covers and what it does not, and the three numbered lists about
 * booking.
 *
 * Until this screen existed these seven lists could only be written by
 * `php artisan tour:import` against a saved HTML file — so a tour added in the
 * panel could be published with a heading, a price and no trip in it.
 *
 * Four tabs rather than seven sections down one page. They are genuinely
 * separate jobs — an editor writing the itinerary is not thinking about visa
 * documents — and a single scroll holding thirteen day cards plus six lists is
 * a page nobody can find their place in. `FormTabs` keeps every panel mounted,
 * so moving between them never loses what has been typed.
 *
 * One save for all four, because it is one page. The tab strip is a way of
 * looking at the form, not four forms.
 */
export function TourContentForm({
    value,
    isSaving,
    fieldErrors,
    onChange,
    onSubmit,
}: TourContentFormProps) {
    /** Replaces one list, leaving the other six as they were. */
    const set = <Name extends keyof TourContentInput>(name: Name, rows: TourContentInput[Name]) =>
        onChange({ ...value, [name]: rows });

    /* The five flat lists differ only in what they are called and what they
       say, so they are described rather than written out five times. */
    const flatList = (
        name:
            | 'highlights'
            | 'inclusions'
            | 'exclusions'
            | 'booking_steps'
            | 'documents'
            | 'guidelines',
        props: {
            label: string;
            hint: string;
            addLabel: string;
            placeholder: string;
            numbered?: boolean;
        },
    ) => (
        <ParagraphListField<LineInput>
            name={name}
            value={value[name]}
            disabled={isSaving}
            errors={fieldErrors}
            onChange={(rows) => set(name, rows)}
            onAdd={blankLine}
            {...props}
        />
    );

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
                event.preventDefault();
                if (!isSaving) onSubmit();
            }}
            noValidate
        >
            <FormTabs
                tabs={[
                    {
                        id: 'itinerary',
                        label: `Itinerary${value.itinerary.length ? ` (${value.itinerary.length})` : ''}`,
                        description:
                            'The day-by-day. Days are numbered by their order here, so moving one renumbers the rest.',
                        panel: (
                            <FormSection
                                title="Day by day"
                                description="One card per day. The dates are worked out from the departure date in the CRM — you do not need to type them."
                            >
                                <ItineraryField
                                    value={value.itinerary}
                                    disabled={isSaving}
                                    errors={fieldErrors}
                                    onChange={(days) => set('itinerary', days)}
                                />
                            </FormSection>
                        ),
                    },
                    {
                        id: 'highlights',
                        label: `Highlights${value.highlights.length ? ` (${value.highlights.length})` : ''}`,
                        description: 'The bullets under the opening prose.',
                        panel: (
                            <FormSection
                                title="Trip highlights"
                                description="What makes this tour worth the trip. Shown as ticked points under the opening paragraphs."
                            >
                                {flatList('highlights', {
                                    label: 'Highlights',
                                    hint: 'One point per row. A tour with none simply does not show the section.',
                                    addLabel: 'Add a highlight',
                                    placeholder: 'Stay two nights in a working coffee estate.',
                                })}
                            </FormSection>
                        ),
                    },
                    {
                        id: 'price',
                        label: "What's included",
                        description: 'What the price covers, and what it does not.',
                        panel: (
                            <div className="flex flex-col gap-4">
                                <FormSection
                                    title="What is included"
                                    description="What the tour price covers."
                                >
                                    {flatList('inclusions', {
                                        label: 'Inclusions',
                                        hint: 'One per row, as a traveller would read it.',
                                        addLabel: 'Add an inclusion',
                                        placeholder: 'AC bus from Bangalore and back.',
                                    })}
                                </FormSection>

                                <FormSection
                                    title="What is not included"
                                    description="What a traveller pays for separately. Worth being plain about — this is where complaints come from."
                                >
                                    {flatList('exclusions', {
                                        label: 'Exclusions',
                                        hint: 'One per row.',
                                        addLabel: 'Add an exclusion',
                                        placeholder: 'Travel insurance.',
                                    })}
                                </FormSection>
                            </div>
                        ),
                    },
                    {
                        id: 'booking',
                        label: 'Booking',
                        description:
                            'The three numbered lists at the foot of the page. Numbered by their order here.',
                        panel: (
                            <div className="flex flex-col gap-4">
                                <FormSection
                                    title="How to make a booking"
                                    description="The numbered steps. The amounts and deadlines differ per tour, which is why they are written here rather than once for the site."
                                >
                                    {flatList('booking_steps', {
                                        label: 'Booking steps',
                                        hint: 'Numbered on the page in this order.',
                                        addLabel: 'Add a step',
                                        placeholder: 'Call us to request a booking.',
                                        numbered: true,
                                    })}
                                </FormSection>

                                <FormSection
                                    title="Documents required"
                                    description="What a traveller must send. Leave empty on a domestic tour that needs nothing."
                                >
                                    {flatList('documents', {
                                        label: 'Documents',
                                        hint: 'Numbered on the page in this order.',
                                        addLabel: 'Add a document',
                                        placeholder:
                                            'Original passport, valid six months beyond return.',
                                        numbered: true,
                                    })}
                                </FormSection>

                                <FormSection
                                    title="Travel and health guidelines"
                                    description="What this tour asks of a traveller — walking pace, altitude, weather."
                                >
                                    {flatList('guidelines', {
                                        label: 'Guidelines',
                                        hint: 'Numbered on the page in this order.',
                                        addLabel: 'Add a guideline',
                                        placeholder:
                                            'You must be able to walk at a good pace for up to two hours.',
                                        numbered: true,
                                    })}
                                </FormSection>
                            </div>
                        ),
                    },
                ]}
            />

            <FormActions
                cancelHref={paths.admin.tours}
                submitLabel="Save page content"
                isSaving={isSaving}
            />
        </form>
    );
}
