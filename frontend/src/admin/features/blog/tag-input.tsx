import { X } from 'lucide-react';
import { useState } from 'react';

import { Field } from '@/admin/components/form-section';
import { Input } from '@/shared/ui/input';

type TagInputProps = {
    id: string;
    value: string[];
    onChange: (tags: string[]) => void;
    error?: string;
    disabled?: boolean;
};

/**
 * A short list of words.
 *
 * Enter or a comma commits one, Backspace on an empty box takes the last one
 * back. Typed tags are trimmed and de-duplicated here rather than on the
 * server's word alone, so an editor sees immediately that "Ladakh" and
 * "ladakh " are the same tag.
 */
export function TagInput({ id, value, onChange, error, disabled = false }: TagInputProps) {
    const [draft, setDraft] = useState('');

    const commit = (raw: string) => {
        const tag = raw.trim().replace(/,+$/, '');

        if (tag === '') return;
        if (!value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
            onChange([...value, tag]);
        }

        setDraft('');
    };

    return (
        <Field
            label="Tags"
            htmlFor={id}
            error={error}
            hint="Type a tag and press Enter. Tags group posts without giving each one a page."
        >
            <div className="flex flex-col gap-2">
                <Input
                    id={id}
                    value={draft}
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    placeholder="Ladakh"
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => commit(draft)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ',') {
                            // Enter in a form submits it; here it means "that
                            // is one tag", so the form must not hear it.
                            event.preventDefault();
                            commit(draft);
                        }

                        if (event.key === 'Backspace' && draft === '' && value.length > 0) {
                            onChange(value.slice(0, -1));
                        }
                    }}
                />

                {value.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                        {value.map((tag) => (
                            <li key={tag}>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border py-1 pr-1.5 pl-2.5 text-xs font-medium text-foreground">
                                    {tag}
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        aria-label={`Remove ${tag}`}
                                        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 focus-visible:outline-none"
                                        onClick={() =>
                                            onChange(value.filter((existing) => existing !== tag))
                                        }
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </Field>
    );
}
