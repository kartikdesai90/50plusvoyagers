import { Field } from '@/admin/components/form-section';
import { Textarea } from '@/shared/ui/textarea';

type ContentEditorProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
};

/**
 * Where a post is written.
 *
 * **This is a plain text area, not a rich text editor.** This project has none
 * — there is no editor package in `package.json` and no editor component
 * anywhere in `resources/js` — and adding one is a dependency decision, not
 * something to slip into a module.
 *
 * It is its own component precisely so that decision stays cheap: every screen
 * that writes long-form content uses this, so swapping the internals for a real
 * editor is one file, and the value it hands back is a string either way.
 *
 * Until then an editor writes plain paragraphs, and the public renderer decides
 * how to present them.
 */
export function ContentEditor({
    id,
    value,
    onChange,
    error,
    disabled = false,
}: ContentEditorProps) {
    const words = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;

    return (
        <Field
            label="Post"
            htmlFor={id}
            error={error}
            hint={`${words} ${words === 1 ? 'word' : 'words'} · about ${Math.max(1, Math.ceil(words / 200))} min to read`}
        >
            <Textarea
                id={id}
                className="min-h-96 font-normal"
                value={value}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                placeholder="Write the post here. Leave a blank line between paragraphs."
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}
