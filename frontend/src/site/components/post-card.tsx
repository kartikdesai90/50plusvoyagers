import { ArrowRight } from 'lucide-react';

import { NavLink } from '@/site/components/nav-link';
import { blogPostPath } from '@/routes/paths';
import type { JournalCard } from '@/site/types/journal';

/**
 * One journal article, as a card.
 *
 * The homepage's journal row in listing form: same image frame and hover scrim,
 * with the excerpt and byline the listing needs added beneath the title.
 */
export function PostCard({ post }: { post: JournalCard }) {
    return (
        <article data-voy-card>
            <NavLink href={blogPostPath(post.slug)} className="group block text-ink">
                <div className="relative overflow-hidden rounded-[10px]">
                    <img
                        src={post.image_url ?? ''}
                        alt={post.image_alt}
                        loading="lazy"
                        data-voy-img
                        className="h-[clamp(220px,22vw,260px)] w-full object-cover"
                    />
                    <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.8)] to-transparent to-70% p-[22px]">
                        <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.04em]">
                            Read article
                            <ArrowRight className="size-[15px]" aria-hidden="true" />
                        </span>
                    </div>
                </div>

                <div className="mt-4 mb-[9px] flex flex-wrap gap-3 text-xs font-bold tracking-[0.04em] text-ink-muted">
                    {/*
                     * The category may be absent — an editor can file a post
                     * under nothing — and the separator goes with it rather
                     * than leaving a dot with one side of it missing.
                     */}
                    {post.category ? (
                        <>
                            <span>{post.category}</span>
                            <span className="opacity-50">·</span>
                        </>
                    ) : null}
                    <span>{post.reading_time}</span>
                </div>

                <h3 className="font-serif text-xl/[1.25] font-medium tracking-[-0.01em] text-ink transition-colors group-hover:text-brand">
                    {post.title}
                </h3>

                <p className="mt-2.5 line-clamp-3 text-[15px]/[1.55] text-ink-muted">
                    {post.excerpt}
                </p>

                <p className="mt-3.5 text-[13px] text-ink-muted">By {post.author}</p>
            </NavLink>
        </article>
    );
}
