import { ChevronDown } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';

export type SelectOption = {
    value: string;
    label: string;
    /** The line under the option. Room the browser's own list never has. */
    description?: string;
};

type SelectFieldProps = {
    id: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    invalid?: boolean;
    className?: string;
};

/**
 * A list of choices the panel draws itself.
 *
 * The browser's own `select` is a fine control with one hard limit: the open
 * list is drawn by the operating system, so it cannot be styled, cannot carry
 * a second line of explanation, and looks like a different application every
 * time it opens. This is built on the same menu primitive the user menu uses,
 * so the open state belongs to the panel — and each option gets room to say
 * what it means.
 *
 * The trigger is a `button`, which is a labelable element: an ordinary
 * `<label for>` still points at it, and Radix supplies the keyboard behaviour,
 * focus return and the chosen-item semantics.
 */
export function SelectField({
    id,
    value,
    options,
    onChange,
    placeholder = 'Choose…',
    disabled = false,
    invalid = false,
    className,
}: SelectFieldProps) {
    const selected = options.find((option) => option.value === value);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    id={id}
                    type="button"
                    disabled={disabled}
                    aria-invalid={invalid}
                    className={cn(
                        'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm shadow-xs',
                        'transition-[color,box-shadow] outline-none',
                        'hover:border-ring/60',
                        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
                        'data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/25',
                        'aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        className,
                    )}
                >
                    <span className={cn('truncate', selected ? '' : 'text-muted-foreground')}>
                        {selected?.label ?? placeholder}
                    </span>
                    <ChevronDown
                        className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                    />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                /* Matches the trigger, so the list reads as the field opening
                   rather than as a panel arriving from somewhere else. */
                className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56"
            >
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    {options.map((option) => (
                        <DropdownMenuRadioItem key={option.value} value={option.value}>
                            <span className="flex min-w-0 flex-col">
                                <span className="font-medium">{option.label}</span>
                                {option.description ? (
                                    <span className="mt-0.5 text-xs text-muted-foreground">
                                        {option.description}
                                    </span>
                                ) : null}
                            </span>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
