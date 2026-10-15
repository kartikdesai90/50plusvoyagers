'use client';

import { useMemo, useState } from 'react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { NavLink } from '@/site/components/nav-link';
import { PageHero } from '@/site/components/page-hero';
import { PostCard } from '@/site/components/post-card';
import { blogPostPath } from '@/routes/paths';
import type { JournalCard } from '@/site/types/journal';
import { cn } from '@/shared/lib/utils';

/** The button that is always there, whatever has been filed. */
const ALL = 'All';

type BlogPageProps = {
    /** Every published article, in reading order. The first one leads. */
    posts: JournalCard[];
    /** Assembled from what has actually been filed, not a maintained list. */
    categories: string[];
};

/**
 * The journal index.
 *
 * The lead article gets the homepage divider's treatment — a wide photograph
 * with the copy over a left-to-right scrim — and everything after it falls into
 * the same card grid the homepage journal row uses. Filtering is client state
 * for the same reason as the tour listing: every article is already in the
 * markup, so narrowing the list must not cost a round trip.
 *
 * Which article leads is the server's decision, arriving as the first of the
 * list — featured first, then whatever order an editor arranged. The page only
 * knows that the first one is the one to give the wide treatment to.
 */
export default function BlogPage({ posts, categories }: BlogPageProps) {
    const [category, setCategory] = useState<string>(ALL);

    const [lead, ...rest] = posts;

    const visible = useMemo(
        () => (category === ALL ? rest : rest.filter((post) => post.category === category)),
        [category, rest],
    );

    /*
     * An empty journal is a real state now that the articles come from the
     * database — a fresh install with nothing published has no lead article to
     * put at the top of the page.
     */
    if (!lead) {
        return (
            <>
                <PageHero
                    eyebrow="Blogs"
                    title="Notes for the *road ahead*"
                    lead="Travelogues, wellbeing notes and practical advice — most of it written by the people who travel with us."
                />

                <Section>
                    <Container className="max-w-[600px] py-12 text-center">
                        <p className="text-[17px]/[1.6] text-ink-muted">
                            The first article is being written. Do come back.
                        </p>
                    </Container>
                </Section>

                <CtaBand
                    heading="Have a story of your *own*?"
                    body="Members write most of what appears here. Send us your travelogue and we will edit it gently and publish it."
                />
            </>
        );
    }

    return (
        <>
            <PageHero
                eyebrow="Blogs"
                title="Notes for the *road ahead*"
                lead="Travelogues, wellbeing notes and practical advice — most of it written by the people who travel with us."
            />

            <Section top="none" bottom="sm">
                <Container>
                    <NavLink
                        href={blogPostPath(lead.slug)}
                        className="voy-divider group block text-white"
                    >
                        <img
                            src={lead.image_url ?? ''}
                            alt={lead.image_alt}
                            className="w-full object-cover"
                            fetchPriority="high"
                        />
                        <div className="voy-divider-body">
                            <p className="mb-4 text-[11.5px] font-bold tracking-[0.18em] text-white/80 uppercase">
                                {lead.category ? `${lead.category} · ` : ''}
                                {lead.reading_time}
                            </p>
                            <h2 className="font-serif text-[clamp(27px,3.5vw,46px)]/[1.06] font-normal tracking-[-0.02em] text-balance">
                                {lead.title}
                            </h2>
                            <p className="mt-5 text-[clamp(15px,1.3vw,17px)]/[1.62] text-white/85">
                                {lead.excerpt}
                            </p>
                            <p className="mt-6 border-t border-white/30 pt-4 text-[14px] text-white/80">
                                By {lead.author} · {lead.date}
                            </p>
                        </div>
                    </NavLink>
                </Container>
            </Section>

            <Section top="sm">
                <Container>
                    <div className="mb-[clamp(32px,4vw,44px)] flex flex-wrap items-end justify-between gap-6">
                        <div>
                            <Eyebrow className="mb-[18px]">All articles</Eyebrow>
                            <SectionHeading size="h3">From the *community*</SectionHeading>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            {[ALL, ...categories].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setCategory(option)}
                                    aria-pressed={category === option}
                                    className={cn(
                                        'rounded-full border px-[18px] py-2.5 text-[13px] font-bold tracking-[0.04em] transition-colors',
                                        category === option
                                            ? 'border-brand bg-brand text-white'
                                            : 'border-hairline text-ink hover:border-brand hover:text-brand',
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {visible.length > 0 ? (
                        <div
                            data-voy-group
                            className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-[clamp(18px,2vw,28px)] gap-y-[clamp(36px,4vw,52px)]"
                        >
                            {visible.map((post) => (
                                <PostCard key={post.slug} post={post} />
                            ))}
                        </div>
                    ) : (
                        <p className="py-12 text-center text-[17px] text-ink-muted">
                            Nothing filed under {category} just yet.
                        </p>
                    )}
                </Container>
            </Section>

            <CtaBand
                heading="Have a story of your *own*?"
                body="Members write most of what appears here. Send us your travelogue and we will edit it gently and publish it."
            />
        </>
    );
}
