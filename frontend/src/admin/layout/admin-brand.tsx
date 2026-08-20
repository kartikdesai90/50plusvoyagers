import { Link } from '@/shared/router';

import { cn } from '@/shared/lib/utils';
import { paths } from '@/routes/paths';

/**
 * Wordmark shared by the sidebar and the mobile drawer. When `collapsed` the
 * lettering drops away and only the badge remains, so it fits the icon rail.
 */
export function AdminBrand({ className, collapsed = false }: AdminBrandProps) {
    return (
        <Link
            to={paths.admin.dashboard}
            aria-label="Voyagers Admin — dashboard"
            className={cn(
                'flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25',
                collapsed && 'justify-center gap-0',
                className,
            )}
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-serif text-[13px] font-semibold text-white">
                50+
            </span>
            {collapsed ? null : (
                <span className="flex flex-col leading-none">
                    <span className="font-serif text-[17px] font-semibold text-foreground">
                        Voyagers
                    </span>
                    <span className="mt-1 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                        Admin
                    </span>
                </span>
            )}
        </Link>
    );
}

type AdminBrandProps = {
    className?: string;
    /** Render badge-only, for the collapsed sidebar rail. */
    collapsed?: boolean;
};
