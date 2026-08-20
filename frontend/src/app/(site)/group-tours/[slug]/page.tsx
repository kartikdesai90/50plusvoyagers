import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/site/config/site';
import { findTour, tours } from '@/site/data/tours';
import GroupTourPage from '@/site/pages/group-tour';
import { pageMetadata } from '@/site/seo/metadata';

type RouteProps = { params: Promise<{ slug: string }> };

/**
 * The addresses this route answers on.
 *
 * The catalogue is static, so every tour page is known at build time and each
 * one is rendered once rather than on every request.
 */
export function generateStaticParams() {
    return tours.map((tour) => ({ slug: tour.slug }));
}

/**
 * Nothing outside that list is a tour.
 *
 * This is the constraint that used to live on the Laravel route — `whereIn`
 * against the same slugs — and it does the same job: an unknown tour is a real
 * 404, not a 200 with an apology in it. It is now stated once, next to the
 * catalogue it is derived from, rather than in a controller that had to be kept
 * in step with a front-end module by hand.
 */
export const dynamicParams = false;

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const tour = findTour(slug);

    if (!tour) {
        return pageMetadata({ title: `Tour not found — ${siteConfig.name}`, noindex: true });
    }

    return pageMetadata({
        title: `${tour.title} — ${tour.duration} from ${tour.price} — ${siteConfig.name}`,
        description: tour.summary,
        path: `/group-tours/${tour.slug}`,
    });
}

export default async function Page({ params }: RouteProps) {
    const { slug } = await params;

    if (!findTour(slug)) {
        notFound();
    }

    return <GroupTourPage slug={slug} />;
}
