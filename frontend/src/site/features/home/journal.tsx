import { ArrowRight } from 'lucide-react';

import { Container, Eyebrow, RuleLink, Section, SectionHeading } from '@/site/components/section';
import { SiteImage } from '@/site/components/site-image';
import { NavLink } from '@/site/components/nav-link';
import { blogPostPath, paths } from '@/routes/paths';
import type { JournalCard } from '@/site/types/journal';

/**
 * The journal row.
 *
 * The homepage's invitation to the index rather than the index itself, so the
 * server sends only the three articles that fit across it. Each card links to
 * the article it is showing, and the rule link to the whole journal.
 */
export function Journal({ items }: { items: JournalCard[] }) {
    if (items.length === 0) return null;

    return (
        <Section id="journal" top="sm">
            <Container>
                <div className="mb-[clamp(32px,4vw,48px)] flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <Eyebrow className="mb-[18px]">Blogs</Eyebrow>
                        <SectionHeading className="text-balance">
                            Notes for the *road ahead*
                        </SectionHeading>
                    </div>
                    <RuleLink href={paths.blog} className="pb-[5px] whitespace-nowrap">
                        All articles
                    </RuleLink>
                </div>

                <div
                    data-voy-group
                    className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-[clamp(18px,2vw,28px)]"
                >
                    {items.map((article) => (
                        <NavLink
                            key={article.id}
                            href={blogPostPath(article.slug)}
                            className="group block text-ink"
                        >
                            <div className="relative overflow-hidden rounded-[10px]">
                                <div className="relative h-[clamp(220px,22vw,260px)] w-full">
                                    <SiteImage
                                        src={article.image_url ?? ''}
                                        alt={article.image_alt}
                                        /* Three across on desktop, one on a phone. */
                                        sizes="(max-width: 700px) 100vw, (max-width: 1180px) 50vw, 380px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.8)] to-transparent to-70% p-[22px]">
                                    <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.04em]">
                                        Read article
                                        <ArrowRight className="size-[15px]" aria-hidden="true" />
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 mb-[9px] flex gap-3 text-xs font-bold tracking-[0.04em] text-ink-muted">
                                <span>{article.date}</span>
                                <span className="opacity-50">·</span>
                                <span>{article.reading_time}</span>
                            </div>
                            <h3 className="font-serif text-xl/[1.25] font-medium tracking-[-0.01em] text-ink">
                                {article.title}
                            </h3>
                        </NavLink>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
