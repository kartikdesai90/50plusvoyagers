import type { Metadata } from 'next';

import GroupToursPage from '@/site/pages/group-tours';
import { fetchTourCards } from '@/site/data/tour-content';
import { fromCard } from '@/site/data/tour-view';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `Group tours for travellers over 50 — ${siteConfig.name}`,
        description:
            'Small-group, fully hosted departures across India and the world, designed for travellers aged fifty and over. Twelve to sixteen guests, an unhurried pace, and a tour manager on every trip.',
        path: '/group-tours',
    });
}

/**
 * The listing, from the database.
 *
 * Fetched on the server before anything renders, like the homepage's calendar
 * and for the same reason: a grid of departures that arrived after hydration is
 * a grid no crawler ever reads, and this is the page that exists to be found.
 *
 * What is published is what shows. There is no fallback to the shipped
 * catalogue here — the homepage keeps one because it must look finished above
 * the fold on a cold install, whereas a *listing* that pads itself with twenty
 * departures nobody can book is actively misleading. An empty grid says the
 * honest thing, and publishing a tour fills it.
 */
export default async function Page() {
    const cards = await fetchTourCards();

    return <GroupToursPage tours={cards.map(fromCard)} />;
}
