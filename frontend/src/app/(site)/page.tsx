import type { Metadata } from 'next';

import { siteConfig } from '@/site/config/site';
import { fetchHomeContent } from '@/site/data/home-content';
import { fetchTourCards } from '@/site/data/tour-content';
import HomePage from '@/site/pages/home';
import { pageMetadata } from '@/site/seo/metadata';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: siteConfig.name,
        description: siteConfig.description,
        path: '/',
    });
}

/**
 * The homepage.
 *
 * Everything is fetched on the server before anything renders, which is what
 * the Inertia controller did when it resolved all four sets in the request. The
 * hero image is in the first response either way.
 *
 * The two fetches run together rather than in sequence: they do not depend on
 * each other, and awaiting them one after the other would put the slower one's
 * latency on top of the faster one's for no reason.
 */
export default async function Page() {
    const [{ hero, banners, values, why, toasts, films, gallery, articles }, tourCards] =
        await Promise.all([fetchHomeContent(), fetchTourCards()]);

    return (
        <HomePage
            hero={hero}
            banners={banners}
            values={values}
            why={why}
            toasts={toasts}
            films={films}
            gallery={gallery}
            articles={articles}
            tourCards={tourCards}
        />
    );
}
