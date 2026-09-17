import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';

import { Field, FormGrid } from '@/admin/components/form-section';
import { blankDay } from '@/admin/features/tours/content-defaults';
import type { DayInput } from '@/admin/features/tours/content-types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

/**
 * The day-by-day.
 *
 * A field of its own rather than another {@link ParagraphListField}, because a
 * day is not a paragraph: it carries a heading, a sub-heading, the prose, where
 * the group sleeps and what it eats. Six boxes to a row is too much for a list
 * and is why each day gets a card.
 *
 * The day number is not editable and is not typed. It is the row's position,
 * recomputed on every save — which is what the table's unique index on
 * `(tour_id, day_number)` needs, and what stops an editor who inserts a day at
 * the top from renumbering the twelve under it by hand.
 *
 * The date is the interesting field, and the hint on it is doing real work. The
 * old pages hard-code a date on every day — thirteen of them on Spain-Portugal
 * — so re-running the tour next year meant thirteen hand edits. It is normally
 * left empty and counted from the CRM's departure date instead. The box stays
 * for the day that genuinely needs an override.
 */
export function ItineraryField({
    value,
    disabled = false,
    errors = {},
    onChange,
}: {
    value: DayInput[];
    disabled?: boolean;
    /** Keyed as the server keys them — `itinerary.2.heading`. */
    errors?: Record<string, string>;
    onChange: (days: DayInput[]) => void;
}) {
    const ids = useId();

    const update = (index: number, patch: Partial<DayInput>) =>
        onChange(value.map((day, at) => (at === index ? { ...day, ...patch } : day)));

    const remove = (index: number) => onChange(value.filter((_, at) => at !== index));

    const move = (index: number, by: -1 | 1) => {
        const target = index + by;
        if (target < 0 || target >= value.length) return;

        const reordered = [...value];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

        onChange(reordered);
    };

    return (
        <div className="flex flex-col gap-3">
            {errors.itinerary ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                    {errors.itinerary}
                </p>
            ) : null}

            {value.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                    No itinerary yet. Add the first day and it will appear on the page.
                </p>
            ) : null}

            {value.map((day, index) => {
                const headingError = errors[`itinerary.${index}.heading`];
                const at = `${ids}-${day.key}`;

                return (
                    <section
                        key={day.key}
                        className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
                            {/* The number the page will print, which is this
                                row's position and nothing an editor types. */}
                            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand tabular-nums">
                                {index + 1}
                            </span>
                            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                                {day.heading.trim() || `Day ${index + 1}`}
                            </h3>

                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled || index === 0}
                                    aria-label={`Move day ${index + 1} earlier`}
                                    onClick={() => move(index, -1)}
                                    className="size-7 text-muted-foreground"
                                >
                                    <ChevronUp className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled || index === value.length - 1}
                                    aria-label={`Move day ${index + 1} later`}
                                    onClick={() => move(index, 1)}
                                    className="size-7 text-muted-foreground"
                                >
                                    <ChevronDown className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled}
                                    aria-label={`Remove day ${index + 1}`}
                                    onClick={() => remove(index)}
                                    className="size-7 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 p-4">
                            <FormGrid>
                                <Field
                                    label="Heading"
                                    htmlFor={`${at}-heading`}
                                    required
                                    error={headingError}
                                    hint="As the page prints it, e.g. “Day 1: Arrive Porto”."
                                >
                                    <Input
                                        id={`${at}-heading`}
                                        value={day.heading}
                                        maxLength={255}
                                        disabled={disabled}
                                        placeholder="Day 1: Arrive Porto"
                                        aria-invalid={Boolean(headingError)}
                                        onChange={(event) =>
                                            update(index, { heading: event.target.value })
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Sub-heading"
                                    htmlFor={`${at}-title`}
                                    error={errors[`itinerary.${index}.title`]}
                                    hint="The line under it. Optional."
                                >
                                    <Input
                                        id={`${at}-title`}
                                        value={day.title}
                                        maxLength={255}
                                        disabled={disabled}
                                        placeholder="Portugal's riverside rebel"
                                        onChange={(event) =>
                                            update(index, { title: event.target.value })
                                        }
                                    />
                                </Field>
                            </FormGrid>

                            <Field
                                label="What happens"
                                htmlFor={`${at}-body`}
                                error={errors[`itinerary.${index}.body`]}
                                hint="The day's prose. Leave empty for a day at leisure."
                            >
                                <Textarea
                                    id={`${at}-body`}
                                    value={day.body}
                                    rows={4}
                                    disabled={disabled}
                                    onChange={(event) =>
                                        update(index, { body: event.target.value })
                                    }
                                />
                            </Field>

                            <FormGrid>
                                <Field
                                    label="Where you stay"
                                    htmlFor={`${at}-stay`}
                                    error={errors[`itinerary.${index}.stay`]}
                                    hint="e.g. 4* Hotel in Porto."
                                >
                                    <Input
                                        id={`${at}-stay`}
                                        value={day.stay}
                                        maxLength={255}
                                        disabled={disabled}
                                        placeholder="4* Hotel in Porto"
                                        onChange={(event) =>
                                            update(index, { stay: event.target.value })
                                        }
                                    />
                                </Field>

                                <Field
                                    label="Meals"
                                    htmlFor={`${at}-meals`}
                                    error={errors[`itinerary.${index}.meals`]}
                                    hint="e.g. Breakfast, Dinner."
                                >
                                    <Input
                                        id={`${at}-meals`}
                                        value={day.meals}
                                        maxLength={255}
                                        disabled={disabled}
                                        placeholder="Breakfast, Dinner"
                                        onChange={(event) =>
                                            update(index, { meals: event.target.value })
                                        }
                                    />
                                </Field>
                            </FormGrid>

                            {/*
                             * Normally empty on purpose. Counted from the CRM's
                             * departure date, so re-running the tour next year
                             * re-dates the whole itinerary by itself.
                             */}
                            <Field
                                label="Date"
                                htmlFor={`${at}-date`}
                                error={errors[`itinerary.${index}.day_date`]}
                                hint="Leave empty. The date is counted from the departure date in the CRM — only set one here if this day needs a date of its own."
                                className="sm:max-w-56"
                            >
                                <Input
                                    id={`${at}-date`}
                                    type="date"
                                    value={day.day_date}
                                    disabled={disabled}
                                    onChange={(event) =>
                                        update(index, { day_date: event.target.value })
                                    }
                                />
                            </Field>
                        </div>
                    </section>
                );
            })}

            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onChange([...value, blankDay()])}
                >
                    <Plus className="size-4" />
                    {value.length === 0 ? 'Add the first day' : `Add day ${value.length + 1}`}
                </Button>
            </div>
        </div>
    );
}
