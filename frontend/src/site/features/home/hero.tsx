'use client';

import { ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Container, Section } from '@/site/components/section';
import { Button } from '@/shared/ui/button';
import { BandMedia } from '@/site/features/home/band-media';
import { withEmphasis } from '@/site/components/emphasis';
import { useHeroSlider } from '@/site/features/home/use-hero-slider';
import type { Band } from '@/site/types/band';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The top of the homepage.
 *
 * The slides come from the database now; the markup does not know that. What
 * it does know is that the words belong to the first slide: the design has one
 * `<h1>`, and a heading that changed as the pictures advanced would be a
 * different design and a worse page.
 *
 * The caption over the photograph is the exception, and it is not one: it used
 * to be printed straight into this file, so an editor could change everything
 * about the hero except the white text a visitor reads first. It comes from the
 * bands now, and from the band being *shown* rather than the lead one — a
 * caption names the picture beneath it, so it has to advance with the carousel.
 * A slide with none written draws none, rather than an empty scrim or the lead's
 * words over somebody else's photograph.
 */
export function Hero({ slides }: { slides: Band[] }) {
    const { index, step } = useHeroSlider(slides.length);
    const lead = slides[0];

    /*
     * The caption belongs to the picture under it, so it advances with the
     * carousel — a slide showing one photograph and another slide's words is
     * a caption that describes the wrong thing.
     *
     * The centred block above stays with the lead band, for the reason in the
     * docblock: one `h1` per page. A slide with no caption written draws none,
     * rather than borrowing the lead's.
     */
    const caption = slides[index]?.caption ?? null;

    /*
     * The slides after the first are mounted once the browser has nothing better
     * to do.
     *
     * All five sit inside the hero's box, so the browser counts every one of
     * them as being on screen and fetches the lot immediately — a quarter of a
     * megabyte of photographs that cannot be seen for at least the length of the
     * autoplay interval, downloaded in competition with the one photograph that
     * is on screen now. Holding them back until the page is idle leaves the
     * first slide the bandwidth to itself.
     *
     * Nothing about the carousel changes: the count below the frame reads from
     * `slides`, not from what is mounted, and the first advance is seconds after
     * this has run.
     */
    const [showRest, setShowRest] = useState(false);

    useEffect(() => {
        /* Safari has no `requestIdleCallback`; a timeout is the same promise, roughly kept. */
        const canIdle = typeof window.requestIdleCallback === 'function';

        const handle = canIdle
            ? window.requestIdleCallback(() => setShowRest(true), { timeout: 2500 })
            : window.setTimeout(() => setShowRest(true), 1200);

        return () => {
            if (canIdle) window.cancelIdleCallback(handle);
            else window.clearTimeout(handle);
        };
    }, []);

    return (
        <Section top="sm" bottom="none">
            {/*
                Marked so the first-paint cloak can hide exactly what the intro
                animates — this block — and leave the photograph below it to
                paint as soon as it arrives. `buildHero` reads the same element.
            */}
            <Container data-voy-hero-copy className="text-center">
                {lead.label ? (
                    <p className="voy-eyebrow mb-[22px] tracking-[0.26em]">{lead.label}</p>
                ) : null}
                <h1 className="voy-heading mx-auto max-w-[14ch] text-display [line-height:1] tracking-[-0.025em]">
                    {withEmphasis(lead.heading)}
                </h1>
                {lead.description ? (
                    <p className="mx-auto mt-6 max-w-[560px] text-[clamp(16px,1.4vw,19px)]/[1.6] text-ink-muted">
                        {lead.description}
                    </p>
                ) : null}
                <div className="mt-[30px] flex flex-wrap items-center justify-center gap-x-[26px] gap-y-4">
                    {lead.button ? (
                        <Button asChild variant="brand" size="pill">
                            <a href={lead.button.url}>
                                {lead.button.text}
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </a>
                        </Button>
                    ) : null}
                    <a
                        href="#why"
                        className="inline-flex items-center gap-[9px] text-sm font-bold tracking-[0.02em] text-ink transition-colors hover:text-brand"
                    >
                        <Play className="size-[15px] fill-current" aria-hidden="true" />
                        How it works
                    </a>
                </div>
            </Container>

            <Container className="relative mt-[clamp(40px,5vw,64px)]">
                <div className="voy-hero-media">
                    {/* Marks the slider so the intro leaves these frames to the CSS transition. */}
                    <div data-voy-hero-slides className="absolute inset-0">
                        {slides.map((slide, i) =>
                            i === 0 || showRest ? (
                                <BandMedia
                                    key={slide.id}
                                    band={slide}
                                    className="voy-hero-slide"
                                    priority={i === 0}
                                    active={i === index}
                                />
                            ) : null,
                        )}
                    </div>

                    {caption ? (
                        <div className="voy-hero-reveal">
                            <div className="voy-hero-caption">
                                <div>
                                    {caption.label ? (
                                        <span className="voy-hero-badge">{caption.label}</span>
                                    ) : null}
                                    {caption.heading ? (
                                        <div className="voy-hero-title">{caption.heading}</div>
                                    ) : null}
                                    {caption.text ? (
                                        <p className="voy-hero-sub">{caption.text}</p>
                                    ) : null}
                                </div>
                                {caption.button ? (
                                    <a href={caption.button.url} className="voy-hero-link">
                                        {caption.button.text}
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-3.5 pt-[18px]">
                    {/* The design repeats the caption's badge here, quietly. */}
                    <div className="text-xs font-bold tracking-[0.16em] text-ink-muted uppercase">
                        {caption?.label}
                    </div>
                    <div className="flex items-center gap-3.5">
                        <span
                            className="text-xs font-bold tracking-[0.12em] text-ink-muted"
                            aria-live="polite"
                        >
                            {pad(index + 1)} / {pad(slides.length)}
                        </span>
                        <Button
                            variant="outline_circle"
                            size="circle"
                            aria-label="Previous photo"
                            onClick={() => step(-1)}
                        >
                            <ChevronLeft className="size-[17px]" />
                        </Button>
                        <Button
                            variant="outline_circle"
                            size="circle"
                            aria-label="Next photo"
                            onClick={() => step(1)}
                        >
                            <ChevronRight className="size-[17px]" />
                        </Button>
                    </div>
                </div>
            </Container>
        </Section>
    );
}
