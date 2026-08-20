import { Plus, X } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { LinkPair } from '@/admin/features/settings/types';

/**
 * A list of links an editor adds a row at a time.
 *
 * Two boxes to a row — what the link says and where it goes — because a link is
 * both of those and neither is any use alone. A row left half-finished is
 * dropped on the way to the server rather than reported as an error: an empty
 * row is somebody who changed their mind, not somebody who made a mistake.
 *
 * The list is rendered by position rather than by any id, so the rows are keyed
 * by index. That is safe here because the only edits are to a row in place, or
 * removing one — nothing reorders them, so a row never swaps identity with its
 * neighbour behind React's back.
 */
export function LinkListField({
    label,
    hint,
    addLabel,
    urlPlaceholder = 'https://',
    value,
    disabled = false,
    error,
    onChange,
}: {
    label: string;
    hint?: string;
    addLabel: string;
    urlPlaceholder?: string;
    value: LinkPair[];
    disabled?: boolean;
    error?: string;
    onChange: (links: LinkPair[]) => void;
}) {
    const id = useId();

    const update = (index: number, patch: Partial<LinkPair>) =>
        onChange(value.map((link, at) => (at === index ? { ...link, ...patch } : link)));

    const remove = (index: number) => onChange(value.filter((_, at) => at !== index));

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-0-label`}>{label}</Label>

            {value.length > 0 ? (
                <ul className="flex flex-col gap-2">
                    {value.map((link, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <Input
                                id={`${id}-${index}-label`}
                                value={link.label}
                                disabled={disabled}
                                placeholder="Label"
                                aria-label={`${label} ${index + 1} — text`}
                                onChange={(event) => update(index, { label: event.target.value })}
                                className="sm:max-w-44"
                            />
                            <Input
                                value={link.url}
                                disabled={disabled}
                                placeholder={urlPlaceholder}
                                aria-label={`${label} ${index + 1} — address`}
                                onChange={(event) => update(index, { url: event.target.value })}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={disabled}
                                aria-label={`Remove ${link.label || `${label} ${index + 1}`}`}
                                onClick={() => remove(index)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <X className="size-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : null}

            <div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onChange([...value, { label: '', url: '' }])}
                >
                    <Plus className="size-4" />
                    {addLabel}
                </Button>
            </div>

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
