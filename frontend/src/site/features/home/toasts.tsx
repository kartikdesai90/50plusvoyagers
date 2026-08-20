import type { CSSProperties } from 'react';

import { Container, Section } from '@/site/components/section';
import type { Feedback } from '@/site/types/feedback';

/** Seconds each quote spends crossing the band. */
const SECONDS_PER_QUOTE = 9;

function QuoteMark() {
    return (
        <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="mx-auto mb-4 text-brand opacity-28"
            aria-hidden="true"
        >
            <path d="M7 7h4v4c0 3.3-2.7 6-6 6v-2c1.7 0 3-1.3 3-3H7V7zm10 0h4v4c0 3.3-2.7 6-6 6v-2c1.7 0 3-1.3 3-3h-1V7z" />
        </svg>
    );
}

function Quote({ quote }: { quote: Feedback }) {
    return (
        <figure className="voy-toast">
            <QuoteMark />
            <blockquote className="font-serif text-[clamp(19px,1.9vw,23px)]/[1.36] font-normal tracking-[-0.01em] text-balance text-ink">
                {quote.quote}
            </blockquote>
            <figcaption className="mt-auto flex items-center justify-center gap-[13px] pt-[26px]">
                {quote.photo_url ? (
                    <img
                        src={quote.photo_url}
                        alt={quote.name}
                        loading="lazy"
                        className="size-[52px] shrink-0 rounded-full object-cover"
                    />
                ) : null}
                <div className="text-left">
                    <div className="text-[15px] font-bold text-ink">{quote.name}</div>
                    {quote.context ? (
                        <div className="mt-0.5 text-[13px] text-ink-muted">{quote.context}</div>
                    ) : null}
                </div>
            </figcaption>
        </figure>
    );
}

/**
 * Written feedback, scrolling.
 *
 * The quotes come from the database, and there are more of them than fit across
 * a screen, so the band carries them past instead of choosing three and hiding
 * the rest. An editor adding a seventh quote gets a seventh quote on the page
 * rather than a decision about which one to drop.
 *
 * The duplicate set is what makes the loop seamless — the track is moved by
 * exactly one set's width and snaps back to a frame that looks identical. It is
 * `aria-hidden` because it is the same six quotes: a screen reader should hear
 * each traveller once, not twice.
 *
 * Two quotes or fewer are left as a plain centred row. A marquee needs enough
 * content to look like motion rather than like two cards twitching.
 */
export function Toasts({ items }: { items: Feedback[] }) {
    const quotes = items.filter((item) => item.quote);

    if (quotes.length === 0) return null;

    if (quotes.length <= 2) {
        return (
            <Section tone="alt" top="sm">
                <Container>
                    <div
                        data-voy-group
                        className="flex flex-wrap justify-center gap-[clamp(28px,3.4vw,48px)]"
                    >
                        {quotes.map((quote) => (
                            <Quote key={quote.id} quote={quote} />
                        ))}
                    </div>
                </Container>
            </Section>
        );
    }

    return (
        <Section tone="alt" top="sm">
            {/*
             * Full-bleed: the band reads as a strip passing through the page,
             * so it is not held inside the measure the other sections keep.
             *
             * The reveal group is the wrapper rather than the scrolling element.
             * A CSS animation outranks an inline style in the cascade, so the
             * motion layer setting a transform on the track would be silently
             * overridden by the marquee — and the marquee, in turn, would be
             * reset by the layer restoring that style afterwards.
             */}
            <div data-voy-group>
                <div
                    className="voy-toasts"
                    style={
                        {
                            '--voy-toasts-duration': `${quotes.length * SECONDS_PER_QUOTE}s`,
                        } as CSSProperties
                    }
                >
                    {/*
                     * The two sets sit on one track with the same gap between
                     * every card, whether the neighbour is in its own set or the
                     * next — which is exactly what the keyframe's arithmetic
                     * assumes. Nesting the echo changes nothing about that: the
                     * inner gaps and the one between the groups add up to the
                     * same run of cards.
                     */}
                    <div className="voy-toasts-track">
                        {quotes.map((quote) => (
                            <Quote key={quote.id} quote={quote} />
                        ))}

                        <div
                            aria-hidden="true"
                            className="flex shrink-0 items-stretch gap-[var(--voy-toasts-gap)]"
                        >
                            {quotes.map((quote) => (
                                <Quote key={`echo-${quote.id}`} quote={quote} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
