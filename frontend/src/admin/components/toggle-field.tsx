import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';

/**
 * A setting that is either on or off, with a line saying what that means.
 *
 * The line changes with the switch where the two states have different
 * consequences — "travellers can see this" and "hidden until you switch this on"
 * are more use than a label repeating the word next to it.
 */
export function ToggleField({
    id,
    label,
    description,
    checked,
    disabled = false,
    onChange,
}: {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-3.5 py-3">
            <div className="min-w-0">
                <Label htmlFor={id} className="block">
                    {label}
                </Label>
                <p className="mt-0.5 text-xs/relaxed text-muted-foreground">{description}</p>
            </div>
            <Switch
                id={id}
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
        </div>
    );
}
