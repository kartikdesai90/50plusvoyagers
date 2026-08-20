import type { LucideIcon } from 'lucide-react';
import { Link } from '@/shared/router';

import { Button } from '@/shared/ui/button';

type IconActionProps = {
    icon: LucideIcon;
    /** Says what the action does. Becomes the tooltip and the accessible name. */
    label: string;
    disabled?: boolean;
    variant?: 'ghost' | 'outline';
    /** Renders a link instead of a button; use for actions that go somewhere. */
    to?: string;
    href?: string;
    onClick?: () => void;
};

/**
 * A row action reduced to its icon.
 *
 * A table of six text buttons per row is a table nobody can scan. The words do
 * not disappear, though: `title` gives a sighted user the tooltip on hover, and
 * the same string is read aloud, so the action is never a shape you have to
 * learn. This is the pattern the collapsed sidebar already uses.
 */
export function IconAction({
    icon: Icon,
    label,
    disabled = false,
    variant = 'ghost',
    to,
    href,
    onClick,
}: IconActionProps) {
    const content = (
        <>
            <Icon aria-hidden="true" />
            <span className="sr-only">{label}</span>
        </>
    );

    if (to) {
        return (
            <Button asChild variant={variant} size="icon" title={label}>
                <Link to={to}>{content}</Link>
            </Button>
        );
    }

    if (href) {
        return (
            <Button asChild variant={variant} size="icon" title={label}>
                <a href={href} target="_blank" rel="noreferrer">
                    {content}
                </a>
            </Button>
        );
    }

    return (
        <Button
            type="button"
            variant={variant}
            size="icon"
            title={label}
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
        >
            {content}
        </Button>
    );
}
