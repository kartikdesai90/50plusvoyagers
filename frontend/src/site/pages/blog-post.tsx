'use client';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { PostCard } from '@/site/components/post-card';
import { paths } from '@/routes/paths';
import type { JournalCard, JournalPost } from '@/site/types/journal';

type BlogPostPageProps = {
    post: JournalPost;
    /** Up to three others, the same category first. */
    related: JournalCard[];
};

/**
 * One article.
 *
 * A single narrow column — 68 characters at most — because that is the measure
 * long prose is comfortable at, and no amount of available width changes that.
 * The photograph above it is the same rounded frame the homepage hero uses, so
 * an article still reads as part of this site rather than as a document dropped
 * into it.
 *
 * The post arrives whole rather than being looked up here. An address with
 * nothing published at it is decided by the route, before this renders, so this
 * component is never handed a post that does not exist.
 */
export default function BlogPostPage({ post, related }: BlogPostPageProps) {
    return (
        <>
            <Section top="sm" bottom="none">
                <Container>
                    <div className="mx-auto max-w-[760px] text-center">
                        {post.category ? (
                            <Eyebrow className="mb-[18px]">{post.category}</Eyebrow>
                        ) : null}
                        <h1 className="voy-heading text-[clamp(32px,4.6vw,56px)] [line-height:1.05] tracking-[-0.025em]">
                            {post.title}
                        </h1>
                        <p className="mt-6 text-[clamp(16px,1.4vw,19px)]/[1.6] text-ink-muted">
                            {post.excerpt}
                        </p>
                        <p className="mt-7 text-[13px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                            By {post.author} · {post.date} · {post.reading_time}
                        </p>
                    </div>

                    {post.image_url ? (
                        <div className="voy-hero-media mt-[clamp(36px,4vw,52px)]">
                            <img
                                src={post.image_url}
                                alt={post.image_alt}
                                className="size-full object-cover"
                                fetchPriority="high"
                            />
                        </div>
                    ) : null}
                </Container>
            </Section>

            <Section top="sm">
                <Container className="max-w-[720px]">
                    <article className="flex flex-col gap-6">
                        {post.body.map((paragraph, i) => (
                            <p
                                key={i}
                                className="max-w-[68ch] text-[clamp(16.5px,1.35vw,18px)]/[1.72] text-ink"
                            >
                                {paragraph}
                            </p>
                        ))}
                    </article>

                    <div className="mt-[clamp(40px,5vw,60px)] border-t border-hairline pt-8">
                        <p className="text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                            Written by
                        </p>
                        <p className="mt-2.5 font-serif text-[22px] text-ink">{post.author}</p>
                        <p className="mt-1.5 text-[15px]/[1.6] text-ink-muted">
                            A member of the 50+ Voyagers community, writing about the road.
                        </p>
                    </div>
                </Container>
            </Section>

            {/*
             * Only where there is something to keep reading. A journal with one
             * article in it should not print an invitation to read the others.
             */}
            {related.length > 0 ? (
                <Section tone="alt">
                    <Container>
                        <div className="mb-[clamp(28px,3vw,40px)]">
                            <Eyebrow className="mb-[18px]">Keep reading</Eyebrow>
                            <SectionHeading size="h3">More from the *journal*</SectionHeading>
                        </div>

                        <div
                            data-voy-group
                            className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(18px,2vw,28px)]"
                        >
                            {related.map((other) => (
                                <PostCard key={other.slug} post={other} />
                            ))}
                        </div>
                    </Container>
                </Section>
            ) : null}

            <CtaBand
                tone="surface"
                heading="Somewhere in here is your *next trip*."
                body="Our departures fill in the order members hear about them. Join the club and hear first."
                action={{ label: 'Become a member', href: paths.membership }}
            />
        </>
    );
}
