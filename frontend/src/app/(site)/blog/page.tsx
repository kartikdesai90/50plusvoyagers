import type { Metadata } from 'next';

import BlogPage from '@/site/pages/blog';
import { fallbackCategories, fallbackPosts } from '@/site/data/journal';
import { fetchJournalIndex } from '@/site/data/journal-content';
import { pageMetadata } from '@/site/seo/metadata';
import { siteConfig } from '@/site/config/site';

export function generateMetadata(): Promise<Metadata> {
    return pageMetadata({
        title: `The journal — travel stories from our members — ${siteConfig.name}`,
        description:
            'Travelogues, wellbeing notes and practical advice, written by members of the 50+ Voyagers community and by our team.',
        path: '/blog',
    });
}

/**
 * The journal index.
 *
 * Fetched on the server, before anything renders, for the same reason the
 * homepage's content is: an index whose articles arrived after hydration is an
 * index no crawler ever reads, and a journal exists to be found.
 *
 * Falls back to the articles the design ships with when the API is unreachable
 * or nothing has been published yet — the same rule the homepage follows, so a
 * fresh install has a journal rather than an empty page with a heading on it.
 */
export default async function Page() {
    const journal = await fetchJournalIndex();
    const posts = journal?.posts.length ? journal.posts : fallbackPosts;
    const categories = journal?.posts.length ? journal.categories : fallbackCategories;

    return <BlogPage posts={posts} categories={categories} />;
}
