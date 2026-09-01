import {
    BadgeCheck,
    GalleryHorizontal,
    Images,
    LayoutDashboard,
    Map,
    MessageSquareQuote,
    Newspaper,
    Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { paths } from '@/routes/paths';

export type AdminNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    /** Match the path exactly rather than by prefix (use for index routes). */
    end?: boolean;
};

export type AdminNavSection = {
    /** Omit for the primary, unlabelled group. */
    title?: string;
    items: AdminNavItem[];
};

/**
 * The sidebar is driven entirely by this array — adding a future admin module
 * means appending an entry here and registering its route. Nothing else in the
 * layout needs to change.
 */
export const adminNav: AdminNavSection[] = [
    {
        items: [
            {
                label: 'Dashboard',
                href: paths.admin.dashboard,
                icon: LayoutDashboard,
                end: true,
            },
        ],
    },
    {
        title: 'Website',
        items: [
            {
                label: 'Tours',
                href: paths.admin.tours,
                icon: Map,
            },
            {
                label: 'Hero & Banner',
                href: paths.admin.heroBanners,
                icon: GalleryHorizontal,
            },
            {
                label: 'Home sections',
                href: paths.admin.homeSections,
                icon: BadgeCheck,
            },
            {
                label: 'Feedback',
                href: paths.admin.feedback,
                icon: MessageSquareQuote,
            },
            {
                label: 'Gallery',
                href: paths.admin.gallery,
                icon: Images,
            },
            {
                label: 'Blog',
                href: paths.admin.blog,
                icon: Newspaper,
            },
        ],
    },
    {
        title: 'Configuration',
        items: [
            {
                label: 'Settings',
                href: paths.admin.settings,
                icon: Settings,
            },
        ],
    },
];
