import type { Metadata } from 'next';

import { siteConfig } from '@/site/config/site';
import { fetchHomeContent } from '@/site/data/home-content';
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
 * The only public page with content in the database, so the only one that
 * fetches. It happens here, on the server, before anything renders — which is
 * what the Inertia controller was doing when it resolved all four sets in the
 * request. The hero image is in the first response either way.
 */
export default async function Page() {
    const { hero, banners, values, why, toasts, films, gallery, articles } =
        await fetchHomeContent();

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
        />
    );
}
