import { Contact } from '@/site/features/home/contact';
import { Creed } from '@/site/features/home/creed';
import { Films } from '@/site/features/home/films';
import { FullyHosted } from '@/site/features/home/fully-hosted';
import { Gallery } from '@/site/features/home/gallery';
import { Hero } from '@/site/features/home/hero';
import { ImageDivider } from '@/site/features/home/image-divider';
import { Journal } from '@/site/features/home/journal';
import { PressStrip } from '@/site/features/home/press-strip';
import { Toasts } from '@/site/features/home/toasts';
import { TripCalendar } from '@/site/features/home/trip-calendar';
import { WhoWeAre } from '@/site/features/home/who-we-are';
import { WhyUs } from '@/site/features/home/why-us';
import { fallbackBanners, fallbackHero } from '@/site/data/bands';
import { fallbackFilms, fallbackToasts } from '@/site/data/feedback';
import { fallbackGallery } from '@/site/data/gallery';
import { fallbackPosts } from '@/site/data/journal';
import type { TourCard } from '@/site/data/tour-content';
import { fallbackWhoWeAre } from '@/site/data/who-we-are';
import { fallbackWhyUs } from '@/site/data/why-us';
import type { Band } from '@/site/types/band';
import type { Feedback } from '@/site/types/feedback';
import type { GalleryPhoto } from '@/site/types/gallery';
import type { JournalCard } from '@/site/types/journal';
import type { WhoWeAreCard } from '@/site/types/who-we-are';
import type { WhyUs as WhyUsContent } from '@/site/types/why-us';

/** The journal row is three cards across; a fourth would start a second row. */
const JOURNAL_CARDS = 3;

type HomePageProps = {
    /** Active hero slides, already in display order. */
    hero: Band[];
    /** Active banner bands, already in display order. */
    banners: Band[];
    /** Active "Who we are" cards, already in display order. */
    values: WhoWeAreCard[];
    /** The "Why travel with us" band, or null where none has been written. */
    why: WhyUsContent | null;
    /** Active written feedback, already in display order. */
    toasts: Feedback[];
    /** Active filmed feedback, already in display order. */
    films: Feedback[];
    /** Active photographs, already in display order and already capped. */
    gallery: GalleryPhoto[];
    /** The published articles the journal row shows. */
    articles: JournalCard[];
    /** Published tours for the departure calendar. Empty until any are migrated. */
    tourCards?: TourCard[];
};

/**
 * The homepage.
 *
 * The two banner positions are fixed in this file rather than driven by the
 * data, because they are load-bearing to the design: the page alternates its
 * background tone section by section, and a band that moved would break the
 * rhythm rather than reorder it. Which bands fill those two positions is the
 * editor's to decide; where the positions are is not.
 */
export default function HomePage({
    hero,
    banners,
    values,
    why,
    toasts,
    films,
    gallery,
    articles,
    tourCards = [],
}: HomePageProps) {
    const slides = hero.length > 0 ? hero : fallbackHero;
    const bands = banners.length > 0 ? banners : fallbackBanners;
    const cards = values.length > 0 ? values : fallbackWhoWeAre;
    /* One band rather than a set, so "nothing stored" arrives as a null where
       the others say it by being empty. The fallback is the same bargain. */
    const whyUs = why ?? fallbackWhyUs;
    const quotes = toasts.length > 0 ? toasts : fallbackToasts;
    const stories = films.length > 0 ? films : fallbackFilms;
    const photos = gallery.length > 0 ? gallery : fallbackGallery;
    /* The server already caps this; the slice is what keeps the row three
       across when the fallback articles are the ones being shown. */
    const notes = (articles.length > 0 ? articles : fallbackPosts).slice(0, JOURNAL_CARDS);

    return (
        <>
            <Hero slides={slides} />
            <WhoWeAre cards={cards} />
            <PressStrip />
            <TripCalendar tours={tourCards} />
            {bands[0] ? <ImageDivider band={bands[0]} /> : null}
            <WhyUs content={whyUs} />
            <Toasts items={quotes} />
            <Films items={stories} />
            <Gallery items={photos} />
            <FullyHosted />
            {bands[1] ? <ImageDivider band={bands[1]} /> : null}
            <Creed />
            <Contact />
            <Journal items={notes} />
        </>
    );
}
