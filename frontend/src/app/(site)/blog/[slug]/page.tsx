import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { siteConfig } from '@/site/config/site';
import { fallbackPosts, fallbackRelated } from '@/site/data/journal';
import { fetchJournalPost } from '@/site/data/journal-content';
import BlogPostPage from '@/site/pages/blog-post';
import { pageMetadata } from '@/site/seo/metadata';
import type { JournalArticle } from '@/site/data/journal-content';

type RouteProps = { params: Promise<{ slug: string }> };

/**
 * One article, from the database.
 *
 * No `generateStaticParams` and no `dynamicParams: false` any more. Both were
 * true statements about a journal written into the front end — every article
 * was known at build time, so anything else could be refused outright. An
 * article an editor publishes on Tuesday is not known at build time, and a
 * route that refused it would publish nothing.
 *
 * Falls back to the articles the design ships with, so a fresh install still
 * has a readable journal — and only then, with nothing found either way, is the
 * address genuinely not an article.
 */
async function resolve(slug: string): Promise<JournalArticle | null> {
    const fetched = await fetchJournalPost(slug);

    if (fetched) return fetched;

    const shipped = fallbackPosts.find((post) => post.slug === slug);

    if (!shipped) return null;

    return { post: shipped, related: fallbackRelated(shipped) };
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await resolve(slug);

    if (!article) {
        return pageMetadata({ title: `Article not found — ${siteConfig.name}`, noindex: true });
    }

    const { post } = article;

    return pageMetadata({
        /*
         * The editor's own search title where they wrote one, because that is
         * what it is for; the article's title otherwise.
         */
        title: post.meta_title ?? `${post.title} — ${siteConfig.name}`,
        description: post.meta_description ?? post.excerpt,
        path: `/blog/${post.slug}`,
    });
}

export default async function Page({ params }: RouteProps) {
    const { slug } = await params;
    const article = await resolve(slug);

    if (!article) {
        notFound();
    }

    return <BlogPostPage post={article.post} related={article.related} />;
}
