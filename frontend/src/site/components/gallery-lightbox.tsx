'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { GalleryPhoto } from '@/site/types/gallery';

type GalleryLightboxProps = {
    photos: GalleryPhoto[];
    /** Which photograph is open, as an index into `photos`. */
    index: number;
    onClose: () => void;
    /** Move by one, wrapping at both ends. */
    onMove: (to: number) => void;
};

/**
 * One photograph, filling the screen.
 *
 * The grid behind it is the page; this is a layer over it, so it behaves like
 * every other layer on the web — Escape closes it, the backdrop closes it, and
 * the page underneath does not scroll while it is open. Those three are what a
 * visitor tries without being told.
 *
 * Arrows step through the whole set rather than closing and reopening. A
 * visitor who opened one photograph is usually looking at the gallery, not at
 * that picture, and making them return to the grid between each one is the
 * difference between browsing and clicking.
 *
 * Wrapping at the ends, where the homepage's rail deliberately stops: the rail
 * is a strip a thumb can also swipe, so it has a real beginning and end that
 * the arrows must agree with. Here there is nothing to swipe and no edge to
 * see, so stopping would just be a dead button with no explanation on screen.
 */
export function GalleryLightbox({ photos, index, onClose, onMove }: GalleryLightboxProps) {
    const photo = photos[index];

    /*
     * Where focus goes when the layer opens, and what the arrow keys reach.
     * Without somewhere inside to put it, focus stays on the grid behind —
     * where the next Tab walks a list the visitor can no longer see.
     */
    const closeRef = useRef<HTMLButtonElement>(null);

    /** The element that was focused before this opened, to hand it back. */
    const returnRef = useRef<Element | null>(null);

    const step = useCallback(
        (direction: -1 | 1) => {
            /* `+ photos.length` so stepping back from the first lands on the
               last rather than on -1. */
            onMove((index + direction + photos.length) % photos.length);
        },
        [index, onMove, photos.length],
    );

    /* The page behind the layer does not scroll — the same rule, and the same
       restore-what-was-there, that the header's mobile sheet follows. */
    useEffect(() => {
        const { overflow } = document.body.style;

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = overflow;
        };
    }, []);

    useEffect(() => {
        returnRef.current = document.activeElement;
        closeRef.current?.focus();

        return () => {
            /* Back where they were, so closing the layer does not send a
               keyboard visitor to the top of the document. */
            if (returnRef.current instanceof HTMLElement) returnRef.current.focus();
        };
    }, []);

    /*
     * Escape closes, the arrow keys move. Bound to the document rather than to
     * the layer: the arrows should work wherever focus happens to be inside it,
     * including on the close button it starts on.
     */
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft') step(-1);
            if (event.key === 'ArrowRight') step(1);
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose, step]);

    /*
     * `document` does not exist while the server renders, and a portal needs a
     * real node to render into. Checked directly rather than through a mounted
     * flag: this layer only ever appears in response to a click, so it is never
     * part of the server's output and has no hydration pass to match.
     */
    if (!photo || typeof document === 'undefined') return null;

    /* One photograph is not a set to step through, so it gets no arrows. */
    const many = photos.length > 1;

    /*
     * Rendered into `body`, not where it was written.
     *
     * `position: fixed` is fixed to the viewport only while no ancestor has a
     * transform, filter or containing block of its own — and the homepage
     * animates every section's children with GSAP, which leaves a `transform`
     * on them for the length of the reveal. Inside one of those, the layer was
     * pinned to the section instead of the screen: the backdrop stopped at the
     * band's edges and the page showed through above and below it.
     *
     * A portal sidesteps the whole question rather than fighting each ancestor
     * that might introduce one, and it is what makes this behave identically on
     * the homepage, the tour page and the gallery.
     */
    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label={photo.title}
            /*
             * The backdrop closes it, but only when the backdrop itself was
             * clicked. Without the target check, a click that starts on the
             * picture and drifts a pixel onto the surround closes the layer
             * the visitor was looking at.
             */
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
            className="voy-lightbox"
        >
            <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="voy-lightbox-control absolute top-4 right-4 z-10 sm:top-6 sm:right-6"
            >
                <X className="size-5" strokeWidth={1.8} aria-hidden="true" />
            </button>

            {many ? (
                <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous photograph"
                    className="voy-lightbox-control absolute top-1/2 left-3 z-10 -translate-y-1/2 sm:left-6"
                >
                    <ChevronLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
                </button>
            ) : null}

            {/* Stops a click on the picture or its caption reaching the
                backdrop handler above. */}
            {/*
             * No width cap. The 1100px one stopped a landscape photograph well
             * short of a wide screen, on a layer whose whole purpose is to show
             * the picture as large as it will go — the height bound already
             * keeps a portrait from running off the top and bottom.
             */}
            <figure
                className="voy-lightbox-figure flex w-full flex-col items-center justify-center gap-5"
                onClick={(event) => event.stopPropagation()}
            >
                {/*
                 * A plain `img`, where the rest of the site uses `SiteImage`.
                 *
                 * That component draws with `fill`, which positions the
                 * picture absolutely and asks the caller for a box of known
                 * height to fill — every other caller has one, because they
                 * all draw into a fixed-height card. This is the one place
                 * that cannot: the picture has to take its size from the
                 * photograph and the viewport, which is the shape `fill`
                 * exists to avoid needing. Given a parent with no resolved
                 * height it collapses to nothing, which is exactly what it
                 * did here.
                 *
                 * Nothing is lost by dropping out of the optimiser. The grid
                 * behind has already fetched and decoded this file at a card's
                 * width, and a lightbox is the one view that wants the full
                 * picture rather than a resized one.
                 */}
                <img
                    /* Keyed so React swaps the element rather than reusing it —
                       without it the previous picture stays on screen until the
                       next one decodes. */
                    key={photo.id}
                    src={photo.image_url ?? ''}
                    alt={photo.image_alt}
                    className="voy-lightbox-image"
                />

                <figcaption className="w-full max-w-[720px] shrink-0 text-center">
                    <h2 className="font-serif text-[clamp(20px,2.4vw,27px)]/[1.15] font-medium text-white">
                        {photo.title}
                    </h2>
                    {/* There may be none: a photograph worth showing is not
                        always one with a story attached. */}
                    {photo.caption ? (
                        <p className="mt-2.5 text-[15px]/[1.55] text-white/75">{photo.caption}</p>
                    ) : null}
                    {many ? (
                        <p className="mt-4 text-[11.5px] font-bold tracking-[0.16em] text-white/45 uppercase">
                            {index + 1} of {photos.length}
                        </p>
                    ) : null}
                </figcaption>
            </figure>

            {many ? (
                <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next photograph"
                    className="voy-lightbox-control absolute top-1/2 right-3 z-10 -translate-y-1/2 sm:right-6"
                >
                    <ChevronRight className="size-5" strokeWidth={1.8} aria-hidden="true" />
                </button>
            ) : null}
        </div>,
        document.body,
    );
}
