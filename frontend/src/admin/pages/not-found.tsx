'use client';

import { Link } from '@/shared/router';

import { Button } from '@/shared/ui/button';
import { paths } from '@/routes/paths';

/**
 * Unknown `/admin/*` URLs used to fall through to the site's 404 page, back when
 * one router served both areas. The areas are separate now, so the admin panel
 * carries its own — same primitives, same wording, no new design.
 */
export default function AdminNotFoundPage() {
    return (
        <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-medium text-muted-foreground">404</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                This page could not be found
            </h1>
            <p className="mt-4 max-w-md text-pretty text-muted-foreground">
                The page you are looking for does not exist or may have been moved.
            </p>
            <Button asChild className="mt-8">
                <Link to={paths.admin.dashboard}>Back to the dashboard</Link>
            </Button>
        </section>
    );
}
