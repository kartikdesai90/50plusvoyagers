import { Container, Eyebrow, RuleLink, Section, SectionHeading } from '@/site/components/section';
import { PhotoRail } from '@/site/components/photo-rail';
import { paths } from '@/routes/paths';
import type { GalleryPhoto } from '@/site/types/gallery';

/**
 * Photographs from the road.
 *
 * The band's own words, over {@see PhotoRail}. The row itself — the cards, the
 * sideways scroll, the arrows, the lightbox — is the shared component, because
 * a tour page shows the same row and the two had already drifted apart once
 * when they were written separately.
 *
 * What is left here is what is genuinely the homepage's: an introduction, and a
 * link to the page where the rest of them live.
 */
export function Gallery({ items }: { items: GalleryPhoto[] }) {
    if (items.length === 0) return null;

    return (
        <Section top="none">
            <Container>
                <div className="mb-[clamp(28px,3vw,40px)] flex flex-wrap items-end justify-between gap-5">
                    <div className="max-w-[640px]">
                        <Eyebrow className="mb-[18px]">The gallery</Eyebrow>
                        <SectionHeading size="h3">50+ Voyagers, *over the years*</SectionHeading>
                    </div>
                    <div className="max-w-[280px]">
                        <p className="text-[15px] text-ink-muted">
                            Proof that the best chapters can start at any age. Hover any moment to
                            read the story.
                        </p>
                        {/* The rail shows a handful; this is where the rest of
                            them live. */}
                        <RuleLink href={paths.gallery} className="mt-5">
                            See every photograph
                        </RuleLink>
                    </div>
                </div>

                <PhotoRail photos={items} label="Photographs" />
            </Container>
        </Section>
    );
}
