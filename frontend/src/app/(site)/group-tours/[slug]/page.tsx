import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/site/config/site';
import { fetchTourPage } from '@/site/data/tour-content';
import { findTour, tours } from '@/site/data/tours';
import { fromCatalogue, fromDatabase, type TourView } from '@/site/data/tour-view';
import GroupTourPage from '@/site/pages/group-tour';
import { pageMetadata } from '@/site/seo/metadata';

type RouteProps = { params: Promise<{ slug: string }> };

/**
 * The addresses this route prerenders.
 *
 * Still the shipped catalogue: those twenty are known at build time and there
 * is no reason to render them on demand. A tour that exists only in the
 * database is rendered on first request instead — which is why
 * `dynamicParams = false` is gone.
 *
 * That constant used to be a true statement: every tour lived in the front end,
 * so anything else was genuinely not a tour. It stopped being true the moment a
 * tour could be published from the admin panel, and leaving it would have made
 * every migrated tour a 404.
 */
export function generateStaticParams() {
    return tours.map((tour) => ({ slug: tour.slug }));
}

/**
 * The page, from the database where it has been migrated and from the shipped
 * catalogue where it has not.
 *
 * Both are real answers. Thirty of the thirty-two pages are still to move, and
 * a route that served nothing until they had would make the migration
 * all-or-nothing.
 */
async function resolve(slug: string): Promise<TourView | null> {
    const page = await fetchTourPage(slug);
    const shipped = findTour(slug);

    if (page) {
        return fromDatabase(page, shipped);
    }

    return shipped ? fromCatalogue(shipped) : null;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const tour = await resolve(slug);

    if (!tour) {
        return pageMetadata({ title: `Tour not found — ${siteConfig.name}`, noindex: true });
    }

    /*
     * The editor's own tags where they exist, carried across verbatim from the
     * old pages — that was the client's explicit requirement, and it is what
     * keeps the existing rankings. The generated title is the fallback for a
     * tour that has not been migrated yet, and is exactly what that tour's page
     * produced before.
     */
    return pageMetadata({
        title:
            tour.meta.title ??
            [tour.title, tour.duration, tour.price ? `from ${tour.price}` : null]
                .filter(Boolean)
                .join(' — ')
                .concat(` — ${siteConfig.name}`),
        description: tour.meta.description ?? tour.summary,
        path: `/group-tours/${tour.slug}`,

        /*
         * The tour's own share image, and the words an editor wrote to go with
         * it. All three were being dropped: the admin stores them, the API
         * sends them, the view carries them, and `pageMetadata` had nowhere to
         * put them — so every shared tour link showed the site's picture.
         *
         * The cover photograph stands in where no share image was uploaded. A
         * card showing the trip is better than one showing the company logo,
         * and every published tour has a cover.
         */
        image: tour.meta.ogImage ?? tour.image,
        ogTitle: tour.meta.ogTitle,
        ogDescription: tour.meta.ogDescription,
    });
}

export default async function Page({ params }: RouteProps) {
    const { slug } = await params;
    const tour = await resolve(slug);

    if (!tour) {
        notFound();
    }

    return <GroupTourPage tour={tour} />;
}
