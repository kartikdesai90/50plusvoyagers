'use client';

import type { CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { cn } from '@/shared/lib/utils';
import type { Feedback } from '@/site/types/feedback';

/** How many films stand in the row at once: one in the middle, one either side. */
const SLOTS = 3;

/** How long a set holds still before the row slides on, in milliseconds. */
const HOLD = 3500;

/** Where the mobile layout takes over. Must match the media query in the CSS. */
const NARROW = '(max-width: 760px)';

/** A file the browser can play in a `<video>` element itself. */
const isPlayableFile = (source: string) => /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(source);

/**
 * The same film, as an address that can be embedded rather than visited.
 *
 * Only YouTube and Vimeo are recognised, because those are the two an editor
 * actually pastes. Anything else returns null and keeps the old behaviour — a
 * link out — which is a worse experience than playing in place but a much
 * better one than a card that silently does nothing.
 */
function embedUrl(source: string): string | null {
    const youtube = source.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
    );

    if (youtube) {
        return `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1&rel=0&modestbranding=1`;
    }

    const vimeo = source.match(/vimeo\.com\/(?:video\/)?(\d+)/i);

    if (vimeo) {
        return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
    }

    return null;
}

type Playback = 'file' | 'embed' | 'link' | 'none';

function playbackOf(source: string | null): Playback {
    if (!source) return 'none';
    if (isPlayableFile(source)) return 'file';
    if (embedUrl(source)) return 'embed';

    return 'link';
}

/**
 * Filmed feedback.
 *
 * Three films show at a time — a big one in the middle, a smaller one either
 * side — and every few seconds the row slides one place to the left, so the
 * card that was in the middle moves off and the next film in the list arrives
 * from the right to take its turn. The travel runs with the reading order
 * rather than against it: the film after this one is the one that comes next.
 * The strip is the whole list twice over, so it slides for a full pass and then
 * snaps back to the frame that looks identical — the travel never ends and
 * never doubles back.
 *
 * Nothing is ever moved by a click. Playing a film enlarges the card it is
 * already standing in and holds the row still until it is done; it does not
 * fetch the card to the middle first. The only thing a click changes is which
 * card is the big one and whether it is playing.
 */
export function Films({ items }: { items: Feedback[] }) {
    const withStills = useMemo(() => items.filter((item) => item.thumbnail_url), [items]);
    const total = withStills.length;
    const slides = total > SLOTS;

    /*
     * One card fills the screen on a phone; three share it on a desktop. Read
     * rather than guessed, because the slide moves the strip by whole cards and
     * has to agree with the stylesheet about how many of them are on show.
     */
    const [narrow, setNarrow] = useState(false);

    useEffect(() => {
        const query = window.matchMedia(NARROW);
        const sync = () => setNarrow(query.matches);

        sync();
        query.addEventListener('change', sync);

        return () => query.removeEventListener('change', sync);
    }, []);

    const seen = narrow ? 1 : SLOTS;

    /* The list twice over, so there is always a card waiting on either side. */
    const strip = useMemo(
        () => (slides ? [...withStills, ...withStills] : withStills),
        [slides, withStills],
    );

    /** Which card of the strip stands in the leftmost place. */
    const [at, setAt] = useState(0);
    /** True for the one frame the strip jumps back on, when it must not animate. */
    const [snapping, setSnapping] = useState(false);
    /** A card the visitor made the big one, held until the row slides on. */
    const [pickedAt, setPickedAt] = useState<number | null>(null);
    const [playingAt, setPlayingAt] = useState<number | null>(null);
    /*
     * The card holding a mounted `<video>`. It is whatever was played last
     * rather than whatever is playing, so pausing leaves the film where it was
     * paused instead of unmounting the element and starting it over.
     */
    const [armedAt, setArmedAt] = useState<number | null>(null);
    /** True while someone is reading the row, which is not a moment to move it. */
    const [held, setHeld] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    /* The card in the middle of what is on show — or, on a phone, the only one. */
    const middle = at + Math.floor(seen / 2);

    /*
     * The big one. A card the visitor chose keeps it, but only for as long as
     * that card is still on show: a choice that has slid out of the frame would
     * otherwise leave the row with no big card in it at all.
     */
    const chosen = playingAt ?? pickedAt;
    const bigAt = chosen !== null && chosen >= at && chosen < at + seen ? chosen : middle;

    /*
     * Slide on. Not while a film is playing, and not while the pointer or the
     * keyboard is on the row: both mean someone is looking at what is there.
     */
    useEffect(() => {
        if (!slides || held || playingAt !== null) return;

        const timer = setInterval(() => {
            /*
             * Normally the strip has already snapped back by now — that happens
             * the moment the slide onto the second copy finishes. The wrap here
             * is for the case where it has not, with reduced motion, where
             * there is no transition to finish and so nothing to snap on.
             */
            setAt((current) => (current >= total ? 1 : current + 1));
            setPickedAt(null);
        }, HOLD);

        return () => clearInterval(timer);
    }, [slides, held, playingAt, total]);

    /*
     * The strip has slid a whole pass and is showing the second copy's first
     * cards — the same picture the near end of the strip gives. Jump back to
     * that end with the transition off, and the loop begins again with nothing
     * to see.
     */
    const onSlid = useCallback(
        (event: React.TransitionEvent<HTMLDivElement>) => {
            if (event.propertyName !== 'transform' || event.currentTarget !== event.target) return;
            if (at !== total) return;

            setSnapping(true);
            setAt(0);
            /* The far copy is a different card, so a video mounted in this one
               has nowhere to go: the film returns to being a still. */
            setArmedAt(null);
        },
        [at, total],
    );

    /* Two frames: one for the jump to land on, one to hand the transition back. */
    useEffect(() => {
        if (!snapping) return;

        const outer = requestAnimationFrame(() => {
            requestAnimationFrame(() => setSnapping(false));
        });

        return () => cancelAnimationFrame(outer);
    }, [snapping]);

    const activate = useCallback(
        (index: number) => {
            // The big card is a play/pause button. Any other card is a request
            // to watch that one — which enlarges it where it already stands.
            if (index === playingAt) {
                setPlayingAt(null);

                return;
            }

            setArmedAt(index);
            setPlayingAt(index);
            setPickedAt(index);
        },
        [playingAt],
    );

    /* Follow the element's own state rather than setting it: a film paused from
       the keyboard has to leave the button showing the same thing the film is. */
    useLayoutEffect(() => {
        const video = videoRef.current;

        if (!video) return;

        if (playingAt !== null && playingAt === armedAt) {
            void video.play().catch(() => setPlayingAt(null));
        } else {
            video.pause();
        }
    }, [playingAt, armedAt]);

    if (total === 0) return null;

    /* Which card is big when the row does not slide: the featured one. */
    const staticBig = slides
        ? -1
        : withStills.findIndex((film) => film.is_featured) >= 0
          ? withStills.findIndex((film) => film.is_featured)
          : Math.floor(total / 2);

    const cards = strip.map((film, index) => {
        const isBig = slides ? index === bigAt : index === (pickedAt ?? staticBig);
        const isPlaying = playingAt === index;
        const mode = playbackOf(film.video_source);

        /*
         * Only the cards on show are reachable. The rest of the strip is out
         * past the edge of the frame, and a tab stop out there would scroll the
         * page sideways to somewhere there is nothing to see.
         */
        const offstage = slides && (index < at || index >= at + seen);

        const className = cn('voy-film', isBig && 'voy-film-lg', isPlaying && 'voy-film-playing');

        const body = (
            <>
                <img
                    src={film.thumbnail_url ?? ''}
                    alt={
                        offstage ? '' : [film.name, film.context].filter(Boolean).join(', ')
                    }
                    loading="lazy"
                />

                {/*
                 * Mounted from the moment this card is first played and kept
                 * afterwards, so pausing leaves the film where it was paused.
                 * Nothing is fetched until something is played: a row of stills
                 * stays a row of stills.
                 */}
                {armedAt === index && mode === 'file' ? (
                    <video
                        ref={videoRef}
                        className="voy-film-video"
                        src={film.video_source ?? undefined}
                        poster={film.thumbnail_url ?? undefined}
                        playsInline
                        preload="metadata"
                        onEnded={() => setPlayingAt(null)}
                        onPause={() =>
                            setPlayingAt((current) => (current === index ? null : current))
                        }
                    />
                ) : null}

                {isPlaying && mode === 'embed' ? (
                    <iframe
                        className="voy-film-video"
                        src={embedUrl(film.video_source ?? '') ?? undefined}
                        title={`${film.name} on travelling with 50+ Voyagers`}
                        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                    />
                ) : null}

                <span className="voy-film-veil" />
                <span className="voy-film-meta">
                    <span className="voy-film-name">{film.name}</span>
                    {film.context ? <span className="voy-film-role">{film.context}</span> : null}
                </span>
                <span className="voy-film-play">
                    {isPlaying ? (
                        <Pause className="size-4 fill-white text-white" aria-hidden="true" />
                    ) : (
                        <Play className="size-4 fill-white text-white" aria-hidden="true" />
                    )}
                </span>
            </>
        );

        const key = `${index}-${film.id}`;

        /*
         * `inert` rather than `aria-hidden` + `tabIndex={-1}`.
         *
         * The pair looks equivalent and is not: `tabIndex={-1}` stops a card
         * being tabbed *to* but does not release focus a card already holds, so
         * a visitor who played a film and let the strip slide on left focus
         * inside an `aria-hidden` subtree. The browser refuses that — "Blocked
         * aria-hidden on an element because its descendant retained focus" —
         * and the card stays exposed to assistive technology anyway.
         *
         * `inert` hides the subtree, removes it from the tab order, *and* blurs
         * whatever inside it had focus, which is the whole of what is wanted
         * here in one attribute.
         */
        const shared = {
            className,
            inert: offstage || undefined,
        };

        /*
         * A film we cannot embed keeps the behaviour it always had rather than
         * becoming a button that does nothing.
         */
        if (mode === 'link') {
            return (
                <a
                    key={key}
                    {...shared}
                    href={film.video_source ?? undefined}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Watch ${film.name} talk about travelling with 50+ Voyagers`}
                >
                    {body}
                </a>
            );
        }

        if (mode === 'none') {
            return (
                <div key={key} {...shared}>
                    {body}
                </div>
            );
        }

        return (
            <button
                key={key}
                type="button"
                {...shared}
                onClick={() => activate(index)}
                aria-pressed={isPlaying}
                aria-label={
                    isPlaying
                        ? `Pause ${film.name}`
                        : `Play ${film.name} talking about travelling with 50+ Voyagers`
                }
            >
                {body}
            </button>
        );
    });

    return (
        <Section id="stories" top="sm" className="relative overflow-hidden">
            <Container className="relative">
                <span className="voy-films-deco voy-films-ring" aria-hidden="true" />
                <span className="voy-films-deco voy-films-blob" aria-hidden="true" />

                <div className="relative z-1 mx-auto max-w-[640px] text-center">
                    <Eyebrow className="mb-[18px]">Stories</Eyebrow>
                    <SectionHeading className="text-balance">
                        Toasts from our *travellers*
                    </SectionHeading>
                </div>

                {/*
                 * No reveal group here, on purpose. The motion layer animates
                 * the children of a group with an inline transform, and the
                 * strip carries a transform of its own — the one that does the
                 * sliding. The two would overwrite each other, so the whole row
                 * reveals as a single block instead.
                 */}
                <div className="mt-[clamp(40px,5vw,64px)]">
                    {slides ? (
                        <div
                            className="voy-films-frame"
                            onMouseEnter={() => setHeld(true)}
                            onMouseLeave={() => setHeld(false)}
                            onFocusCapture={() => setHeld(true)}
                            onBlurCapture={() => setHeld(false)}
                        >
                            <div
                                className="voy-films-strip"
                                data-snap={snapping || undefined}
                                onTransitionEnd={onSlid}
                                style={{ '--voy-films-at': at } as CSSProperties}
                            >
                                {cards}
                            </div>
                        </div>
                    ) : (
                        <div className="voy-films">{cards}</div>
                    )}
                </div>
            </Container>
        </Section>
    );
}
