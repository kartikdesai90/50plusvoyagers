import type { Metadata } from 'next';

import GalleryPage from '@/site/pages/gallery';
import { fallbackGallery } from '@/site/data/gallery';
import { fetchGallery } from '@/site/data/gallery-content';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `The gallery — photographs from our trips — ${siteConfig.name}`,
        description:
            'Photographs from our group tours, day-outs and workshops — the places we have taken members over fifty, and the company they kept while they were there.',
        path: '/gallery',
    });
}

/**
 * The gallery.
 *
 * Fetched on the server, before anything renders, for the same reason the
 * journal index is: a grid whose pictures arrived after hydration is a grid no
 * crawler ever sees, and photographs are what this page is for.
 *
 * Falls back to the gallery the design ships with when the API is unreachable
 * or nothing has been uploaded yet — the same rule the homepage follows, so a
 * fresh install has a gallery rather than a heading over an empty page.
 */
export default async function Page() {
    const photos = await fetchGallery();

    return <GalleryPage photos={photos?.length ? photos : fallbackGallery} />;
}
