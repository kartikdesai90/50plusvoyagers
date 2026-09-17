import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

/**
 * A list of paragraphs an editor adds a row at a time, and can reorder.
 *
 * The long-form sibling of {@link TextListField}. That one gives each row a
 * single-line `Input`, which is right for a ticked point on the homepage; these
 * rows are sentences and sometimes several — "Return airfare ex-Bangalore,
 * including taxes" is the short end of an inclusions list — so each row gets a
 * box that grows.
 *
 * Reordering is here and not there because these lists are printed in the order
 * they are given and an editor rewriting a page needs to move things. Two
 * buttons rather than dragging: a drag needs a pointer, and the panel has to be
 * usable from a keyboard.
 *
 * A row left empty is dropped on the way to the server rather than reported as
 * an error — an empty row is somebody who changed their mind, not somebody who
 * made a mistake.
 *
 * Rows are keyed by their own stable `key`, never by index: they can be
 * reordered, and an index key would move the contents rather than the row.
 */
export function ParagraphListField<Row extends { key: string; body: string }>({
    label,
    hint,
    addLabel,
    placeholder,
    value,
    numbered = false,
    disabled = false,
    /** Keyed as the server keys them — `highlights.2.body`. */
    errors = {},
    /** The name the server knows this list by, for looking those errors up. */
    name,
    onChange,
    onAdd,
}: {
    label: string;
    hint?: string;
    addLabel: string;
    placeholder?: string;
    value: Row[];
    /** Printed "1, 2, 3" on the page, so the number is shown while editing. */
    numbered?: boolean;
    disabled?: boolean;
    errors?: Record<string, string>;
    name: string;
    onChange: (rows: Row[]) => void;
    onAdd: () => Row;
}) {
    const ids = useId();

    const update = (index: number, body: string) =>
        onChange(value.map((row, at) => (at === index ? { ...row, body } : row)));

    const remove = (index: number) => onChange(value.filter((_, at) => at !== index));

    /** Swaps a row with its neighbour, which is all reordering a list needs. */
    const move = (index: number, by: -1 | 1) => {
        const target = index + by;
        if (target < 0 || target >= value.length) return;

        const reordered = [...value];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

        onChange(reordered);
    };

    /* The whole-list complaint — too many rows — has no row to sit under. */
    const listError = errors[name];

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <Label htmlFor={`${ids}-0`}>{label}</Label>
                {listError ? (
                    <p role="alert" className="text-xs font-medium text-destructive">
                        {listError}
                    </p>
                ) : hint ? (
                    <p className="text-xs/relaxed text-muted-foreground">{hint}</p>
                ) : null}
            </div>

            {value.length > 0 ? (
                <ul className="flex flex-col gap-2">
                    {value.map((row, index) => {
                        const error = errors[`${name}.${index}.body`];

                        return (
                            <li
                                key={row.key}
                                className="rounded-lg border border-border bg-muted/20 p-2.5"
                            >
                                <div className="flex items-start gap-2">
                                    <span
                                        aria-hidden="true"
                                        className="mt-2.5 w-5 shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums"
                                    >
                                        {numbered ? `${index + 1}.` : '•'}
                                    </span>

                                    <Textarea
                                        id={`${ids}-${index}`}
                                        value={row.body}
                                        rows={2}
                                        disabled={disabled}
                                        placeholder={placeholder}
                                        aria-label={`${label} ${index + 1}`}
                                        aria-invalid={Boolean(error)}
                                        className="min-h-16"
                                        onChange={(event) => update(index, event.target.value)}
                                    />

                                    <div className="flex shrink-0 flex-col gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={disabled || index === 0}
                                            aria-label={`Move ${label} ${index + 1} up`}
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
                                            aria-label={`Move ${label} ${index + 1} down`}
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
                                            aria-label={`Remove ${label} ${index + 1}`}
                                            onClick={() => remove(index)}
                                            className="size-7 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                {error ? (
                                    <p
                                        role="alert"
                                        className="mt-1.5 pl-7 text-xs font-medium text-destructive"
                                    >
                                        {error}
                                    </p>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Nothing here yet. This section will not appear on the page.
                </p>
            )}

            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onChange([...value, onAdd()])}
                >
                    <Plus className="size-4" />
                    {addLabel}
                </Button>
            </div>
        </div>
    );
}
