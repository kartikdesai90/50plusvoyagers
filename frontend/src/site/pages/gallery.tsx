'use client';

import { useCallback, useState } from 'react';

import { Container, Section, SectionHeading } from '@/site/components/section';
import { CtaBand } from '@/site/components/cta-band';
import { GalleryLightbox } from '@/site/components/gallery-lightbox';
import { PageHero } from '@/site/components/page-hero';
import { SiteImage } from '@/site/components/site-image';
import type { GalleryPhoto } from '@/site/types/gallery';

type GalleryPageProps = {
    /** Every visible photograph, in the order editors arranged them. */
    photos: GalleryPhoto[];
};

/**
 * Every photograph, as a page of its own.
 *
 * The homepage shows eight in a rail because it is a band on a page about
 * something else. This is the page, so the same cards stop scrolling sideways
 * and wrap into a grid — nothing is hidden off to one side, and the number of
 * photographs decides the height rather than the reach of an arrow.
 *
 * The cards are the homepage's, unchanged: same frame, same scrim, same title
 * and caption over the picture. A visitor arriving from the homepage rail meets
 * the photographs they were just looking at, laid out rather than redesigned.
 *
 * What is new is that a card opens. The rail could only ever show a picture at
 * card size, which for a gallery is the one thing a visitor actually wants —
 * so here each one is a button onto the full-size view.
 */
export default function GalleryPage({ photos }: GalleryPageProps) {
    /*
     * Which photograph is open, or null for none. An index rather than a
     * photograph: the lightbox steps through the set, and an index is the thing
     * that knows where in it we are.
     */
    const [openAt, setOpenAt] = useState<number | null>(null);

    const close = useCallback(() => setOpenAt(null), []);

    /* A photograph with no file is a record an editor has not finished, and a
       card with an empty frame is worse than one fewer card. */
    const shown = photos.filter((photo) => photo.image_url);

    return (
        <>
            <PageHero
                eyebrow="The gallery"
                title="50+ Voyagers, *over the years*"
                lead="Photographs from the road — the places we have taken members to, and the company they kept while they were there."
            />

            <Section top="sm">
                <Container>
                    {shown.length === 0 ? (
                        /*
                         * A real state, not a defensive one: the photographs
                         * come from the database, so a fresh install has none
                         * until an editor uploads the first. Better a sentence
                         * than a heading over nothing.
                         */
                        <div className="mx-auto max-w-[600px] py-12 text-center">
                            <SectionHeading size="h3">Photographs are on their way</SectionHeading>
                            <p className="mt-4 text-[17px]/[1.6] text-ink-muted">
                                We are putting this year&apos;s pictures together. In the meantime,
                                the trips they came from are on the group tours page.
                            </p>
                        </div>
                    ) : (
                        <div
                            data-voy-group
                            className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-[clamp(12px,1.4vw,18px)]"
                        >
                            {shown.map((photo, index) => (
                                /*
                                 * A button rather than a figure with a click
                                 * handler. It opens a layer, which is what a
                                 * button is for — and it comes with the keyboard
                                 * and the announcement already right, rather
                                 * than a tabindex and a role bolted onto a div.
                                 */
                                <button
                                    key={photo.id}
                                    type="button"
                                    onClick={() => setOpenAt(index)}
                                    aria-label={`View ${photo.title} larger`}
                                    className="group relative block w-full cursor-pointer overflow-hidden rounded-[10px] text-left outline-none"
                                >
                                    <div className="relative h-[clamp(300px,30vw,400px)] w-full">
                                        <SiteImage
                                            src={photo.image_url ?? ''}
                                            alt={photo.image_alt}
                                            /* A wrapping grid of roughly-300px
                                               cards: one across on a phone, two
                                               on a tablet, three or four up. */
                                            sizes="(max-width: 567px) 92vw, (max-width: 867px) 46vw, (max-width: 1135px) 31vw, 280px"
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* The homepage's caption, unchanged — it
                                        rises on hover, and is simply there on a
                                        screen with no pointer to hover with. */}
                                    <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.9)] from-4% via-[rgb(16_15_12/0.25)] via-52% to-transparent to-82% p-6">
                                        <div className="mb-2.5 font-serif text-[23px]/[1.1] font-medium">
                                            {photo.title}
                                        </div>
                                        {photo.caption ? (
                                            <p className="text-sm/[1.5] text-white/85">
                                                {photo.caption}
                                            </p>
                                        ) : null}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </Container>
            </Section>

            <CtaBand tone="alt" />

            {openAt !== null ? (
                <GalleryLightbox photos={shown} index={openAt} onClose={close} onMove={setOpenAt} />
            ) : null}
        </>
    );
}
