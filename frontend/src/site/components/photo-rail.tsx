'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { GalleryLightbox } from '@/site/components/gallery-lightbox';
import { PhotoCard } from '@/site/components/photo-card';
import { Button } from '@/shared/ui/button';
import type { GalleryPhoto } from '@/site/types/gallery';

type PhotoRailProps = {
    photos: GalleryPhoto[];
    /** How wide a card renders, for the browser to pick a file by. */
    sizes?: string;
    /** Named for a screen reader, since two rails can share a page. */
    label?: string;
};

/**
 * A row of photographs that scrolls sideways, and opens.
 *
 * The whole of what the homepage band and a tour's own carousel were each
 * doing: drop the records with no file, remember which picture is open, measure
 * whether the row overflows, draw the arrows, and step through the set in a
 * lightbox. Both wrote that out separately, which is why only one of them had
 * the arrows — the tour's copy was a wrapping grid with no way to reach
 * anything, and the two had already drifted once before over the card itself.
 *
 * What stays with the caller is the part that genuinely differs: the heading
 * over the row, and whatever sits beside it. A band on the homepage introduces
 * itself and links to the gallery; a tour page says "On this trip" and does
 * not. Those are two sentences, not two components.
 *
 * The arrows move by a screenful and let scroll-snap land it: a photograph is
 * either in the row or waiting, never half-shown. Swiping and trackpads work
 * exactly as they did, because the arrows drive the same scroll rather than a
 * position of their own.
 */
export function PhotoRail({
    photos,
    sizes = '(max-width: 700px) 86vw, (max-width: 1180px) 50vw, 400px',
    label = 'Photographs',
}: PhotoRailProps) {
    /* A photograph with no file is a record an editor has not finished, and a
       card with an empty frame is worse than one fewer card. */
    const shown = photos.filter((photo) => photo.image_url);

    /*
     * Which photograph is open, or null for none. An index rather than a
     * photograph: the lightbox steps through the set, and an index is the thing
     * that knows where in it we are.
     */
    const [openAt, setOpenAt] = useState<number | null>(null);

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
    }, [measure, shown.length]);

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

    if (shown.length === 0) return null;

    return (
        <>
            <div ref={railRef} data-voy-group className="voy-gallery">
                {shown.map((photo, index) => (
                    <PhotoCard
                        key={photo.id}
                        src={photo.image_url ?? ''}
                        alt={photo.image_alt}
                        title={photo.title}
                        caption={photo.caption}
                        sizes={sizes}
                        onOpen={() => setOpenAt(index)}
                    />
                ))}
            </div>

            {/*
             * The homepage hero's controls, under the pictures they move. They
             * stop at the ends rather than wrapping: a row a visitor can also
             * swipe has a real beginning and a real end, and an arrow that
             * jumped back to the start from the last photograph would not match
             * what their thumb does.
             */}
            {overflows ? (
                <div className="flex w-full flex-wrap items-center justify-end gap-3.5 pt-[18px]">
                    <Button
                        variant="outline_circle"
                        size="circle"
                        aria-label={`Previous ${label.toLowerCase()}`}
                        disabled={atStart}
                        onClick={() => move(-1)}
                    >
                        <ChevronLeft className="size-[17px]" />
                    </Button>
                    <Button
                        variant="outline_circle"
                        size="circle"
                        aria-label={`Next ${label.toLowerCase()}`}
                        disabled={atEnd}
                        onClick={() => move(1)}
                    >
                        <ChevronRight className="size-[17px]" />
                    </Button>
                </div>
            ) : null}

            {/*
             * Stepping inside the layer walks the whole rail, including the
             * photographs waiting off to the side — the arrows move the row,
             * but once a picture is open the row is not what a visitor is
             * looking at.
             */}
            {openAt !== null ? (
                <GalleryLightbox
                    photos={shown}
                    index={openAt}
                    onClose={() => setOpenAt(null)}
                    onMove={setOpenAt}
                />
            ) : null}
        </>
    );
}
