import { ChevronRight } from 'lucide-react';
import { Link } from '@/shared/router';

export type Crumb = {
    label: string;
    /** Omitted on the last crumb — it is the page you are already on. */
    href?: string;
};

/**
 * Where you are, and the way back.
 *
 * Only shown on screens reached from somewhere else. A module's own list is
 * reached from the sidebar, which already says where you are, so a trail with
 * one entry on it would be furniture.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {items.map((crumb, index) => (
                    <li key={crumb.label} className="flex items-center gap-1.5">
                        {index > 0 ? (
                            <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : null}
                        {crumb.href ? (
                            <Link
                                to={crumb.href}
                                className="transition-colors hover:text-foreground hover:underline"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span aria-current="page" className="text-foreground">
                                {crumb.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
