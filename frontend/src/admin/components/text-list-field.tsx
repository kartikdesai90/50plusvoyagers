import { Plus, X } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

/**
 * A list of lines an editor adds a row at a time.
 *
 * The plain-text sibling of {@link LinkListField}: one box to a row, because a
 * ticked point is a sentence and nothing else. A row left empty is dropped on
 * the way to the server rather than reported as an error — an empty row is
 * somebody who changed their mind, not somebody who made a mistake.
 *
 * The list is rendered by position rather than by any id, so the rows are keyed
 * by index. That is safe here because the only edits are to a row in place, or
 * removing one — nothing reorders them, so a row never swaps identity with its
 * neighbour behind React's back.
 */
export function TextListField({
    label,
    hint,
    addLabel,
    placeholder,
    value,
    max,
    disabled = false,
    error,
    onChange,
}: {
    label: string;
    hint?: string;
    addLabel: string;
    placeholder?: string;
    value: string[];
    /** Where the design stops being able to show them. Hides the add button. */
    max?: number;
    disabled?: boolean;
    error?: string;
    onChange: (lines: string[]) => void;
}) {
    const id = useId();

    const update = (index: number, line: string) =>
        onChange(value.map((existing, at) => (at === index ? line : existing)));

    const remove = (index: number) => onChange(value.filter((_, at) => at !== index));

    const isFull = max !== undefined && value.length >= max;

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-0`}>{label}</Label>

            {value.length > 0 ? (
                <ul className="flex flex-col gap-2">
                    {value.map((line, index) => (
                        <li key={index} className="flex items-start gap-2">
                            {/* Numbered aloud as well as on screen: the order is
                                the order they appear on the homepage, and an
                                editor working through them by ear needs to know
                                which one they are in. */}
                            <span
                                aria-hidden="true"
                                className="mt-2 w-4 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
                            >
                                {index + 1}
                            </span>
                            <Input
                                id={`${id}-${index}`}
                                value={line}
                                disabled={disabled}
                                placeholder={placeholder}
                                aria-label={`${label} ${index + 1}`}
                                onChange={(event) => update(index, event.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                aria-label={`Remove ${line || `${label} ${index + 1}`}`}
                                onClick={() => remove(index)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <X className="size-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : null}

            {!isFull ? (
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => onChange([...value, ''])}
                    >
                        <Plus className="size-4" />
                        {addLabel}
                    </Button>
                </div>
            ) : null}

            {error ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                    {error}
                </p>
            ) : hint ? (
                <p className="text-xs/relaxed text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}
