import { SiteImage } from '@/site/components/site-image';

type PhotoCardProps = {
    src: string;
    /** What a screen reader announces. */
    alt: string;
    /** Printed over the picture in serif. */
    title: string;
    /** The line under the title. There may be none. */
    caption?: string | null;
    /** How wide the card renders, for the browser to pick a file by. */
    sizes: string;
    onOpen: () => void;
};

/**
 * One photograph, as a card that opens.
 *
 * The same card in all three places a set of photographs is shown: the
 * homepage rail, the gallery page grid and a tour's own carousel. It was
 * written three times and had already drifted — the tour's copy printed no
 * title, dimmed its scrim to a different opacity, and added a hover zoom and a
 * focus ring the other two never had. Three copies of a card is three places to
 * fix a caption that sits a pixel too low.
 *
 * A button rather than a figure with a click handler: it opens a layer, which
 * is what a button is for, and it comes with the keyboard and the announcement
 * already right rather than a tabindex and a role bolted onto a div.
 *
 * The frame is fixed in height and the words sit on the picture rather than
 * under it, so a row of cards is the same height whether or not an editor
 * wrote a caption.
 */
export function PhotoCard({ src, alt, title, caption, sizes, onOpen }: PhotoCardProps) {
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`View ${title} larger`}
            className="group relative block w-full cursor-pointer overflow-hidden rounded-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
            <div className="relative h-[clamp(300px,30vw,400px)] w-full">
                <SiteImage src={src} alt={alt} sizes={sizes} className="object-cover" />
            </div>

            {/*
             * The scrim rises on hover, and is simply there on a screen with no
             * pointer to hover with — `voy-overlay` owns that rule so all three
             * callers cannot disagree about it.
             */}
            <div className="voy-overlay bg-linear-to-t from-[rgb(16_15_12/0.9)] from-4% via-[rgb(16_15_12/0.25)] via-52% to-transparent to-82% p-6">
                <div className="mb-2.5 font-serif text-[23px]/[1.1] font-medium">{title}</div>
                {/*
                 * The caption is what an editor wrote for a reader, and there
                 * may be none — a photograph worth showing is not always one
                 * with a story attached, and an empty paragraph would leave a
                 * gap under the title where prose should be.
                 */}
                {caption ? <p className="text-sm/[1.5] text-white/85">{caption}</p> : null}
            </div>
        </button>
    );
}
