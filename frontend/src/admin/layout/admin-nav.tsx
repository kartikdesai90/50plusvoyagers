import { NavLink } from '@/shared/router';

import { adminNav } from '@/admin/config/nav';
import { cn } from '@/shared/lib/utils';

/**
 * Sidebar navigation. Rendered in both the fixed desktop sidebar and the
 * mobile drawer; `onNavigate` lets the drawer close itself on selection.
 *
 * When `collapsed`, items shrink to centred icons. The label stays in the DOM
 * as `sr-only` so each link keeps its accessible name, and `title` supplies a
 * hover tooltip for sighted users.
 */
export function AdminNav({ onNavigate, collapsed = false }: AdminNavProps) {
    return (
        <nav
            className={cn('flex flex-1 flex-col', collapsed ? 'gap-3' : 'gap-6')}
            aria-label="Admin"
        >
            {adminNav.map((section, index) => (
                <div key={section.title ?? `section-${index}`} className="flex flex-col gap-1">
                    {section.title ? (
                        collapsed ? (
                            /* No room for the heading — keep the grouping audible
                               and show a hairline in its place. */
                            <>
                                <h2 className="sr-only">{section.title}</h2>
                                {index > 0 ? (
                                    <hr className="mx-3 mb-2 border-border" aria-hidden="true" />
                                ) : null}
                            </>
                        ) : (
                            <h2 className="mb-1 px-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                {section.title}
                            </h2>
                        )
                    ) : null}

                    {section.items.map(({ label, href, icon: Icon, end }) => (
                        <NavLink
                            key={href}
                            to={href}
                            end={end}
                            onClick={onNavigate}
                            title={collapsed ? label : undefined}
                            className={({ isActive }) =>
                                cn(
                                    'group flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors outline-none',
                                    'focus-visible:ring-[3px] focus-visible:ring-ring/25',
                                    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                                    isActive
                                        ? 'bg-brand/10 text-brand'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className={cn(
                                            'size-[18px] shrink-0 transition-colors',
                                            isActive
                                                ? 'text-brand'
                                                : 'text-muted-foreground group-hover:text-foreground',
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span className={cn(collapsed && 'sr-only')}>{label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            ))}
        </nav>
    );
}

type AdminNavProps = {
    onNavigate?: () => void;
    /** Icon-only rail, for the collapsed desktop sidebar. */
    collapsed?: boolean;
};
