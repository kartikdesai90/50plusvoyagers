'use client';

import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock, MapPin, Users, Wallet, X } from 'lucide-react';

import { Container, Eyebrow, Section, SectionHeading } from '@/site/components/section';
import { EnquiryModal } from '@/site/components/enquiry-modal';
import { TourCard } from '@/site/components/tour-card';
import { TourBookBar } from '@/site/components/tour-book-bar';
import { TourGallery } from '@/site/components/tour-gallery';
import { TourItinerary } from '@/site/components/tour-itinerary';
import { TourPractical } from '@/site/components/tour-practical';
import { CtaBand } from '@/site/components/cta-band';
import { SiteImage } from '@/site/components/site-image';
import { siteConfig } from '@/site/config/site';
import { tourPromises, tours } from '@/site/data/tours';
import type { TourView } from '@/site/data/tour-view';

type GroupTourPageProps = {
    /**
     * The page, already resolved. The route decides whether it came from the
     * database or from the catalogue the design ships with — this renders
     * whichever arrived, and cannot tell the difference beyond the fields that
     * only a migrated tour has.
     */
    tour: TourView;
};

/** The icon for each fact, keyed by the label the view gave it. */
const factIcons: Record<string, typeof CalendarDays> = {
    Departs: CalendarDays,
    Duration: Clock,
    From: Wallet,
    'Group size': Users,
    Region: MapPin,
};

/**
 * The case for this departure in particular.
 *
 * Only shown for a tour whose itinerary is still generated. A migrated tour has
 * the real thing — its own highlights, its own inclusions — and does not need a
 * paragraph restating its duration back at the reader.
 */
const reasons = (tour: TourView) => [
    {
        title: 'The route',
        body: `${tour.itinerary.length} days, in an order that keeps the drives short and the days unhurried.`,
    },
    {
        title: 'The season',
        body: tour.departs
            ? `Timed for ${tour.departs} — chosen because it is when this route is at its most comfortable to travel in.`
            : 'Timed for when this route is at its most comfortable to travel in.',
    },
    {
        title: 'The company',
        body: 'Twelve to sixteen travellers, all over fifty, most of them booking on their own. Nobody is the odd one out.',
    },
];

/**
 * One departure in full.
 *
 * The layout is the homepage's two-column "why us" band promoted to a page: the
 * substance on the left at a comfortable reading measure, and a booking panel
 * on the right that sticks to the viewport on desktop and simply follows the
 * content on anything narrower.
 *
 * Sections whose content only a migrated tour has — the route map, the visa
 * note, the booking steps, the documents list — render only when there is
 * something in them. A tour still on the shipped catalogue looks exactly as it
 * did before the database existed.
 */
export default function GroupTourPage({ tour }: GroupTourPageProps) {
    const others = tours.filter((other) => other.slug !== tour.slug).slice(0, 3);
    const [enquireOpen, setEnquireOpen] = useState(false);

    return (
        <>
            {/*
             * The hero, in two columns.
             *
             * It used to be a heading, then a full-bleed photograph, then the
             * facts — which put a picture between the title and every piece of
             * commercial information on the page. On a laptop a reader saw a
             * name and an image and had to scroll before learning what the trip
             * cost or finding any way to ask about it, which for a tour page is
             * the one thing that must not be buried.
             *
             * Now the words and the picture sit side by side, with the price
             * and the ask on the photograph itself. One column on a phone,
             * where stacking is the only honest layout and the card follows the
             * picture rather than covering it.
             */}
            <Section top="sm" bottom="none">
                <Container>
                    <div className="grid items-center gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
                        <div>
                            <Eyebrow className="mb-[18px]">
                                {tour.region}
                                {tour.duration ? ` · ${tour.duration}` : ''}
                            </Eyebrow>
                            <h1 className="voy-heading text-[clamp(32px,4.4vw,54px)] [line-height:1.04] tracking-[-0.025em]">
                                {tour.title}
                            </h1>
                            {tour.subtitle ? (
                                <p className="mt-4 text-[15px]/[1.6] font-semibold tracking-[0.01em] text-brand">
                                    {tour.subtitle}
                                </p>
                            ) : null}
                            {tour.summary ? (
                                <p className="mt-6 max-w-[560px] text-[clamp(16px,1.3vw,18px)]/[1.62] text-ink-muted">
                                    {tour.summary}
                                </p>
                            ) : null}

                            {/*
                             * The ask, at the top of the page as well as beside
                             * the price further down. A reader who arrived
                             * already convinced — from the homepage calendar,
                             * or a search result — should not have to read the
                             * itinerary to find the button.
                             */}
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setEnquireOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-[15px] font-bold tracking-[0.02em] text-white transition-opacity hover:opacity-90"
                                >
                                    Enquire about this trip
                                    <ArrowRight className="size-[17px]" aria-hidden="true" />
                                </button>
                                {tour.itinerary.length > 0 ? (
                                    <a
                                        href="#itinerary"
                                        className="text-[15px] font-bold text-ink underline decoration-hairline decoration-2 underline-offset-[6px] transition-colors hover:text-brand hover:decoration-brand"
                                    >
                                        See the day by day
                                    </a>
                                ) : null}
                            </div>
                        </div>

                        {tour.image ? (
                            <div className="relative">
                                <div className="voy-hero-media">
                                    <SiteImage
                                        src={tour.image}
                                        alt={tour.images[0]?.alt ?? tour.title}
                                        /* Roughly half the container on a
                                           desktop, the full width below it. */
                                        sizes="(max-width: 1023px) 100vw, 560px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>

                                {/*
                                 * The price, on the picture on a desktop and
                                 * under it on a phone. Over the photograph it
                                 * would cover the very thing a small screen has
                                 * least room for.
                                 */}
                                {tour.price ? (
                                    <div className="mt-4 rounded-2xl border border-hairline bg-surface p-5 shadow-[0_18px_40px_-28px_rgb(16_15_12/0.5)] lg:absolute lg:right-5 lg:bottom-5 lg:mt-0 lg:w-[236px]">
                                        <p className="text-[10.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                            From
                                        </p>
                                        <p className="mt-1.5 font-serif text-[clamp(26px,2.8vw,32px)]/none text-ink">
                                            {tour.price}
                                        </p>
                                        <p className="mt-2 text-[13.5px] text-ink-muted">
                                            per person, twin sharing
                                        </p>
                                        {tour.departs ? (
                                            <p className="mt-3 border-t border-hairline pt-3 text-[13.5px] text-ink-muted">
                                                Departs{' '}
                                                <span className="font-semibold text-ink">
                                                    {tour.departs}
                                                </span>
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <ul
                        data-voy-group
                        className="mt-[clamp(32px,4vw,48px)] grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-6 gap-y-7 border-y border-hairline py-8"
                    >
                        {tour.facts.map(({ label, value }) => {
                            const Icon = factIcons[label] ?? MapPin;

                            return (
                                <li key={label} className="flex items-start gap-3">
                                    <Icon
                                        className="mt-0.5 size-[19px] shrink-0 text-brand"
                                        strokeWidth={1.6}
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p className="text-[10.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                            {label}
                                        </p>
                                        <p className="mt-1 text-[15.5px] font-semibold text-ink">
                                            {value}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Container>
            </Section>

            <Section top="sm">
                <Container>
                    <div className="grid items-start gap-[clamp(36px,4vw,64px)] lg:grid-cols-[1fr_380px]">
                        <div>
                            {/*
                             * The day-by-day. Numbered in the homepage's own
                             * hand — the serif ordinal over a brand rule that
                             * "fully hosted" uses for its steps — so a reader
                             * arriving from the homepage meets a list they
                             * already know how to read.
                             *
                             * A migrated tour also has a hotel, the meals and
                             * the date for each day; a generated one has none
                             * of those, so the footer row appears only when
                             * there is something to put in it.
                             */}
                            {tour.highlights.length > 0 ? (
                                <section className="mb-[clamp(40px,4.5vw,60px)]">
                                    <SectionHeading
                                        size="h3"
                                        className="mb-6 text-[clamp(26px,3vw,36px)]"
                                    >
                                        Trip *highlights*
                                    </SectionHeading>
                                    <ul className="flex flex-col gap-4">
                                        {tour.highlights.map((highlight) => (
                                            <li
                                                key={highlight}
                                                className="flex items-start gap-[13px] text-[16.5px]/[1.6] text-ink"
                                            >
                                                <Check
                                                    className="mt-1 size-5 shrink-0 text-brand"
                                                    strokeWidth={1.7}
                                                    aria-hidden="true"
                                                />
                                                {highlight}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ) : null}

                            {tour.itineraryIsGenerated ? (
                                <section className="mb-[clamp(40px,4.5vw,60px)]">
                                    <SectionHeading
                                        size="h3"
                                        className="mb-6 text-[clamp(26px,3vw,36px)]"
                                    >
                                        Why this *trip*
                                    </SectionHeading>
                                    <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(24px,3vw,36px)]">
                                        {reasons(tour).map((reason) => (
                                            <div
                                                key={reason.title}
                                                className="border-t-2 border-brand pt-[18px]"
                                            >
                                                <h4 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                                    {reason.title}
                                                </h4>
                                                <p className="text-[15px]/[1.58] text-ink-muted">
                                                    {reason.body}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                        </div>

                        <aside id="tour-panel" className="lg:sticky lg:top-[120px]">
                            <div className="rounded-2xl border border-hairline bg-surface-alt p-[clamp(24px,3vw,32px)]">
                                {tour.price ? (
                                    <>
                                        <p className="text-[11.5px] font-bold tracking-[0.16em] text-ink-muted uppercase">
                                            From
                                        </p>
                                        <p className="mt-2 font-serif text-[clamp(32px,3.6vw,42px)]/none text-ink">
                                            {tour.price}
                                        </p>
                                        <p className="mt-2.5 text-[14px] text-ink-muted">
                                            per person, twin sharing
                                        </p>
                                    </>
                                ) : (
                                    <p className="font-serif text-[clamp(24px,2.6vw,30px)]/none text-ink">
                                        Dates on request
                                    </p>
                                )}

                                <dl className="mt-7 flex flex-col gap-3.5 border-t border-hairline pt-6 text-[14.5px]">
                                    {tour.departs ? (
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-ink-muted">Departs</dt>
                                            <dd className="font-semibold text-ink">
                                                {tour.departs}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {tour.duration ? (
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-ink-muted">Duration</dt>
                                            <dd className="font-semibold text-ink">
                                                {tour.duration}
                                            </dd>
                                        </div>
                                    ) : null}
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-ink-muted">Group size</dt>
                                        <dd className="font-semibold text-ink">12–16</dd>
                                    </div>
                                    {tour.bookingFee ? (
                                        <div className="flex justify-between gap-4">
                                            <dt className="text-ink-muted">Booking fee</dt>
                                            <dd className="font-semibold text-ink">
                                                {/* `₹`, as everywhere else the
                                                    site prints a price. This
                                                    was the last `Rs.` in the
                                                    markup, and a booking fee
                                                    spelled differently from the
                                                    tour price two lines above
                                                    it reads as two currencies. */}
                                                {`₹${tour.bookingFee.toLocaleString('en-IN')}`}
                                            </dd>
                                        </div>
                                    ) : null}
                                </dl>

                                {/*
                                 * The ask, kept beside the price. It opens the
                                 * enquiry modal rather than scrolling the
                                 * reader to a form at the foot of the page.
                                 */}
                                <button
                                    type="button"
                                    onClick={() => setEnquireOpen(true)}
                                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-[15px] font-bold tracking-[0.02em] text-white transition-opacity hover:opacity-90"
                                >
                                    Enquire about this trip
                                    <ArrowRight className="size-[17px]" aria-hidden="true" />
                                </button>

                                <p className="mt-5 border-t border-hairline pt-5 text-[14px]/[1.6] text-ink-muted">
                                    {tour.balanceDueDays
                                        ? `The balance is due ${tour.balanceDueDays} days before departure. Call `
                                        : 'Members pay a reduced early-bird price and can spread the cost across instalments. Call '}
                                    <a
                                        href={siteConfig.enquiryPhoneHref}
                                        className="font-semibold text-brand"
                                    >
                                        {siteConfig.enquiryPhone}
                                    </a>{' '}
                                    to hold a seat.
                                </p>
                            </div>
                        </aside>
                    </div>
                </Container>
            </Section>

            {/*
             * The itinerary, with the route beside it.
             *
             * Its own band rather than a column of the booking grid: in there
             * the map was stuck at 380px — portrait, cramped, and unreadable
             * at the size a route map needs to be. Here it has a column of the
             * full width of the page to sit in, so it is legible even at the
             * smaller of the two shares.
             *
             * The map sticks; the list scrolls past it. That is the whole
             * point of putting them side by side — "where is Aveiro relative
             * to Porto" is asked at day three and answered without scrolling.
             */}
            {tour.itinerary.length > 0 ? (
                <Section id="itinerary" top="none">
                    <Container>
                        <SectionHeading
                            size="h3"
                            className="mb-[clamp(24px,3vw,36px)] text-[clamp(26px,3vw,36px)]"
                        >
                            Day *by* day
                        </SectionHeading>

                        {/*
                         * Seven to the days, four to the map.
                         *
                         * The reading column is the wider of the two: a day
                         * opens into several paragraphs of prose, and that is
                         * what a visitor came to this section for. The map
                         * answers "where is Aveiro relative to Porto" — a
                         * glance rather than a read — so it takes the smaller
                         * share and keeps it by sticking.
                         *
                         * `7fr 4fr` rather than the twelfths a grid framework
                         * would use: the eleventh and twelfth columns of a
                         * 7-and-4 split are the gutter, and here that is the
                         * `gap` between them. Stated as a ratio, the two
                         * columns divide what the gap leaves rather than
                         * overflowing it.
                         */}
                        <div className="grid items-start gap-[clamp(28px,3.5vw,48px)] lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
                            <TourItinerary days={tour.itinerary} />

                            {tour.routeMapUrl ? (
                                /*
                                 * No frame. A route map is already a picture
                                 * with its own white ground and its own edges —
                                 * a border and a tinted panel behind it drew a
                                 * box around a box, and the tint showed through
                                 * wherever the map's ratio did not fill it.
                                 *
                                 * Aligned to the top of the list rather than
                                 * centred in the column, so the map and day one
                                 * start on the same line.
                                 */
                                <div className="order-first self-start lg:sticky lg:top-[120px] lg:order-last">
                                    <img
                                        src={tour.routeMapUrl}
                                        alt={`Route map for ${tour.title}`}
                                        loading="lazy"
                                        /*
                                         * Its own shape, capped by height. A
                                         * route map is drawn to fit its route —
                                         * one portrait, another landscape — so
                                         * no width/height pair: hardcoding one
                                         * tour's ratio reserves the wrong space
                                         * for the other thirty-one.
                                         *
                                         * `object-contain` so the cap scales it
                                         * rather than cropping off the end of
                                         * the journey.
                                         */
                                        className="mx-auto block max-h-[min(820px,80vh)] w-full rounded-xl object-contain"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </Container>
                </Section>
            ) : null}

            {/*
             * The photographs, after the route and before the terms.
             *
             * A reader who has just followed thirteen days asks what it looks
             * like, and these are the only pictures on the page taken on the
             * trip itself. They were being fetched and dropped: the hero used
             * the first image's alt text and rendered none of the rest, so a
             * tour with three photographs showed one.
             *
             * The row is the homepage band's own component, so a visitor meets
             * the photographs the same way on both pages — same card, same
             * sideways scroll, same arrows, same lightbox.
             *
             * The cover is in the set rather than held back. The hero crops the
             * same picture full-bleed and panoramic, so seeing it again in the
             * row reads as the set it belongs to rather than as a repeat.
             */}
            {tour.images.length > 0 ? (
                <Section top="none">
                    <Container>
                        <div className="mb-[clamp(24px,3vw,36px)] text-center">
                            <SectionHeading size="h3" className="text-[clamp(26px,3vw,36px)]">
                                On *this trip*
                            </SectionHeading>
                        </div>
                        <TourGallery photos={tour.images} title={tour.title} />
                    </Container>
                </Section>
            ) : null}

            {/*
             * Everything after the itinerary, at full width.
             *
             * These sections used to sit in the same narrow column as the
             * day-by-day, which meant the right-hand third of the page was
             * empty for nearly eight thousand pixels once the booking panel
             * had scrolled past. What is included, the route map, how to book
             * and the documents list are all short, self-contained blocks —
             * they read better side by side than stacked at a reading measure
             * they do not need.
             */}
            <Section top="none">
                <Container>
                    <div className="grid items-start gap-x-[clamp(36px,4vw,72px)] gap-y-[clamp(40px,4.5vw,60px)] lg:grid-cols-2">
                        {/*
                         * Included and excluded, side by side.
                         *
                         * They were one section with the exclusions stacked
                         * underneath, which made the tallest block on the page
                         * — twelve exclusions on an international tour — and
                         * left its neighbour's column empty for the whole
                         * length of it. They are two halves of one question, so
                         * they read better as two columns than as one long one.
                         */}
                        <section>
                            <SectionHeading size="h3" className="mb-6 text-[clamp(26px,3vw,36px)]">
                                What&apos;s *included*
                            </SectionHeading>
                            {/*
                             * A tick and the line, with no thumbnail.
                             *
                             * The inclusions once carried a picture each. It
                             * did not earn its place: at the size a list item
                             * allows, a photo of a hotel is an indistinct
                             * smudge, and a column of them turned a list that is
                             * read into a list that is looked at. The column
                             * went with it — an inclusion is now a bullet like
                             * any other, and shares their table.
                             */}
                            <ul className="flex flex-col gap-3.5">
                                {tour.inclusions.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-start gap-[13px] text-[15.5px]/[1.6] text-ink-muted"
                                    >
                                        <Check
                                            className="mt-1 size-[18px] shrink-0 text-brand"
                                            strokeWidth={1.7}
                                            aria-hidden="true"
                                        />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {tour.exclusions.length > 0 ? (
                            <section>
                                <SectionHeading
                                    size="h3"
                                    className="mb-6 text-[clamp(26px,3vw,36px)]"
                                >
                                    Not *included*
                                </SectionHeading>
                                <ul className="flex flex-col gap-3.5">
                                    {tour.exclusions.map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-start gap-[13px] text-[15.5px]/[1.6] text-ink-muted"
                                        >
                                            <X
                                                className="mt-1 size-[18px] shrink-0 opacity-45"
                                                strokeWidth={1.7}
                                                aria-hidden="true"
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ) : null}

                        {/*
                         * The practical detail, folded away.
                         *
                         * How to book, the visa note, the documents and what to
                         * know before travelling were four full sections here —
                         * roughly two thousand pixels of administration between
                         * a reader who had just finished the itinerary and the
                         * form that lets them act on it. They are looked up
                         * once, at the point they matter, so they open on ask.
                         *
                         * Full width because a closed accordion is one line: in
                         * a half-width column it left the other half empty.
                         */}
                        <TourPractical tour={tour} />

                        <section className="lg:col-span-2">
                            <SectionHeading size="h3" className="mb-6 text-[clamp(26px,3vw,36px)]">
                                How we *host* it
                            </SectionHeading>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(24px,3vw,36px)]">
                                {tourPromises.map((promise) => (
                                    <div
                                        key={promise.title}
                                        className="border-t-2 border-brand pt-[18px]"
                                    >
                                        <h4 className="mb-2.5 text-xs font-bold tracking-[0.16em] text-ink uppercase">
                                            {promise.title}
                                        </h4>
                                        <p className="text-[15px]/[1.58] text-ink-muted">
                                            {promise.body}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </Container>
            </Section>

            {/*
             * Testimonials, full width and on their own ground.
             *
             * They used to sit in the reading column between the visa note and
             * the hosting promises, which put twelve quotes in the middle of a
             * page somebody was reading for its itinerary. They are the last
             * thing before the enquiry, which is where they do their work.
             */}
            {tour.testimonials.length > 0 ? (
                <Section tone="alt">
                    <Container>
                        <div className="mb-[clamp(28px,3vw,40px)] max-w-[640px]">
                            <Eyebrow className="mb-[18px]">In their words</Eyebrow>
                            <SectionHeading size="h3">What our *members* say</SectionHeading>
                        </div>

                        <div
                            data-voy-group
                            className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-[clamp(18px,2vw,28px)]"
                        >
                            {tour.testimonials.slice(0, 6).map((quote) => (
                                <figure
                                    key={`${quote.name}-${quote.body.slice(0, 24)}`}
                                    className="flex flex-col rounded-2xl border border-hairline bg-surface p-[clamp(20px,2.4vw,28px)]"
                                >
                                    <blockquote className="flex-1 text-[15.5px]/[1.65] text-ink-muted">
                                        {quote.body}
                                    </blockquote>
                                    <figcaption className="mt-4 border-t border-hairline pt-3.5 text-[13.5px] font-semibold text-ink">
                                        {quote.name}
                                        {quote.location ? (
                                            <span className="font-normal text-ink-muted">
                                                {' · '}
                                                {quote.location}
                                            </span>
                                        ) : null}
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </Container>
                </Section>
            ) : null}

            <Section>
                <Container>
                    <div className="mb-[clamp(28px,3vw,40px)]">
                        <Eyebrow className="mb-[18px]">You might also like</Eyebrow>
                        <SectionHeading size="h3">Other *departures*</SectionHeading>
                    </div>

                    <div
                        data-voy-group
                        className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(18px,2vw,28px)]"
                    >
                        {others.map((other) => (
                            <TourCard key={other.slug} tour={other} />
                        ))}
                    </div>
                </Container>
            </Section>

            <CtaBand tone="surface" />

            {/*
             * Last in the markup, fixed in the viewport. The booking panel
             * sticks only inside its own section, which ends before the
             * itinerary starts — so for the whole day-by-day and everything
             * after it there was nothing on screen to act on.
             */}
            <TourBookBar
                price={tour.price}
                title={tour.title}
                hidden={enquireOpen}
                onEnquire={() => setEnquireOpen(true)}
            />

            <EnquiryModal
                open={enquireOpen}
                onOpenChange={setEnquireOpen}
                formId={`tour-${tour.slug}`}
                subject={tour.title}
            />
        </>
    );
}
