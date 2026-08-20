'use client';

import Link from 'next/link';

import { Button } from '@/shared/ui/button';
import { paths } from '@/routes/paths';

export default function NotFoundPage() {
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
                <Link href={paths.home}>Back to home</Link>
            </Button>
        </section>
    );
}
