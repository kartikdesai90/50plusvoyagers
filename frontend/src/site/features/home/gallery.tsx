'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Container, Eyebrow, RuleLink, Section, SectionHeading } from '@/site/components/section';
import { SiteImage } from '@/site/components/site-image';
import { Button } from '@/shared/ui/button';
import { paths } from '@/routes/paths';
import type { GalleryPhoto } from '@/site/types/gallery';

/**
 * Photographs from the road.
 *
 * A single row that scrolls sideways, with the homepage hero's arrows under it.
 * The cards are what they always were — same frame, same height, same gap, same
 * scrim — and at any width the row still shows exactly as many of them across as
 * the grid did. What changed is that the ones that do not fit wait off to the
 * side instead of wrapping onto a second line, which is what gives the arrows
 * something to do.
 *
 * The arrows move by a screenful and let scroll-snap land it: a photograph is
 * either in the row or waiting, never half-shown. Swiping and trackpads work
 * exactly as they did, because the arrows drive the same scroll rather than a
 * position of their own.
 */
export function Gallery({ items }: { items: GalleryPhoto[] }) {
    const photos = items.filter((item) => item.image_url);

    const railRef = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    /**
     * Whether there is anything off to the side to reach.
     *
     * Measured rather than counted. How many photographs fit is a question
     * about the width of the screen, not about how many were filed — four fill
     * a desktop row and overflow a laptop one — so counting them would draw the
     * arrows on screens with nothing to scroll and hide them on screens with
     * plenty. False until the first measurement, so the server renders the row
     * without them and nothing claims to scroll before anything can.
     */
    const [overflows, setOverflows] = useState(false);

    /**
     * Where the row stands: whether there is anything either side of it.
     *
     * Read off the rail's own scroll position rather than counted from the
     * cards, so the component never has to know what the media queries decided
     * about how many fit across.
     */
    const measure = useCallback(() => {
        const rail = railRef.current;

        if (!rail) return;

        /* A pixel of slack throughout: a scroll position, and the width of a
           row of fractional card widths, are rarely whole numbers. */
        setOverflows(rail.scrollWidth - rail.clientWidth > 1);
        setAtStart(rail.scrollLeft <= 1);
        setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const rail = railRef.current;

        if (!rail) return;

        measure();

        rail.addEventListener('scroll', measure, { passive: true });
        window.addEventListener('resize', measure);

        /*
         * The cards are photographs, and a photograph that has not loaded yet
         * is a card of a different height but the same width — so this is for
         * the fonts and the fluid sizes settling, not the images. Cheap, and it
         * catches the row becoming scrollable after the first paint.
         */
        const observer = new ResizeObserver(measure);

        observer.observe(rail);

        return () => {
            observer.disconnect();
            rail.removeEventListener('scroll', measure);
            window.removeEventListener('resize', measure);
        };
    }, [measure, photos.length]);

    /*
     * A screenful at a time, and scroll-snap decides where that lands — the row
     * shows whole cards, so moving by the width of it would otherwise leave a
     * sliver of the last one behind. `behavior` is deliberately not passed:
     * that leaves the choice to the stylesheet, which turns the smoothing off
     * for anyone who asked for less motion.
     */
    const move = useCallback((direction: -1 | 1) => {
        const rail = railRef.current;

        if (!rail) return;

        rail.scrollBy({ left: direction * rail.clientWidth });
    }, []);

    if (photos.length === 0) return null;

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

                <div ref={railRef} data-voy-group className="voy-gallery">
                    {photos.map((photo) => (
                        <figure
                            key={photo.id}
                            tabIndex={0}
                            className="group relative overflow-hidden rounded-[10px] outline-none"
                        >
                            <div className="relative h-[clamp(300px,30vw,400px)] w-full">
                                <SiteImage
                                    src={photo.image_url ?? ''}
                                    alt={photo.image_alt}
                                    /* A horizontal rail: each frame is roughly a third. */
                                    sizes="(max-width: 700px) 86vw, (max-width: 1180px) 50vw, 400px"
                                    className="object-cover"
                                />
                            </div>
                            <figcaption className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.9)] from-4% via-[rgb(16_15_12/0.25)] via-52% to-transparent to-82% p-6">
                                <div className="mb-2.5 font-serif text-[23px]/[1.1] font-medium">
                                    {photo.title}
                                </div>
                                {/*
                                 * The caption is what an editor wrote for a
                                 * reader, and there may be none — a photograph
                                 * worth showing is not always one with a story
                                 * attached, and an empty paragraph would leave
                                 * a gap under the title where prose should be.
                                 */}
                                {photo.caption ? (
                                    <p className="text-sm/[1.5] text-white/85">{photo.caption}</p>
                                ) : null}
                            </figcaption>
                        </figure>
                    ))}
                </div>

                {/*
                 * The homepage hero's controls, under the pictures they move.
                 * They stop at the ends rather than wrapping: a row a visitor
                 * can also swipe has a real beginning and a real end, and an
                 * arrow that jumped back to the start from the last photograph
                 * would not match what their thumb does.
                 */}
                {overflows ? (
                    <div className="flex w-full flex-wrap items-center justify-end gap-3.5 pt-[18px]">
                        <Button
                            variant="outline_circle"
                            size="circle"
                            aria-label="Previous photographs"
                            disabled={atStart}
                            onClick={() => move(-1)}
                        >
                            <ChevronLeft className="size-[17px]" />
                        </Button>
                        <Button
                            variant="outline_circle"
                            size="circle"
                            aria-label="Next photographs"
                            disabled={atEnd}
                            onClick={() => move(1)}
                        >
                            <ChevronRight className="size-[17px]" />
                        </Button>
                    </div>
                ) : null}
            </Container>
        </Section>
    );
}
