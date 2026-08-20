import { Container, Section } from '@/site/components/section';
import { withEmphasis } from '@/site/components/emphasis';

/**
 * What the club is for, said once.
 *
 * The last thing the page says before it asks for the enquiry. By this point a
 * visitor has been through the trips, the travellers and the photographs, so
 * the line reads as the sum of what they have just seen rather than as a claim
 * made before anything has been shown to support it. Near the top it was the
 * latter, and it read as an advertisement.
 *
 * So it is a mark, type and space: no photograph, no colour field, no button.
 * The restraint is the design. A statement that arrives in a coloured box reads
 * as an advertisement for the club; the same words set quietly in the page's
 * own serif read as the club meaning them.
 *
 * On the surface tone, sharing the ground with the photograph band above it and
 * carrying no top space of its own — the divider's own bottom padding is the
 * whole of that gap. Two sections each padding their own side of an invisible
 * seam is how a page ends up with a screen of nothing in the middle of it.
 *
 * The space below is the `sm` half of a full seam, because the contact band is
 * `alt`: there the tone actually changes, and the gap is what lets the eye find
 * the edge.
 *
 * The words are the club's own line, the same one the about page opens with.
 * Written here rather than in the settings because a creed is not a fact about
 * the business that changes — it is the design, and an editor who could rewrite
 * it from a form would be rewriting the page rather than filling it in.
 */

const CREED = 'Connecting people. Living adventure. *Celebrating life*.';

const LEAD =
    'Explore, dream, discover an active life with 50+ Voyagers — a travel club and an activity centre, exclusively for senior citizens.';

/**
 * The opening mark, drawn large.
 *
 * The same glyph the toasts band sets over each traveller's quote, at four
 * times the size and in the brand colour — so the section is announced by a
 * mark rather than by a label, and the mark is one the page already speaks.
 *
 * Decorative, and hidden from screen readers: the line beneath is the club's
 * own statement rather than a quotation of somebody else, so there is nothing
 * here for a reader to announce.
 */
function QuoteMark() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="mx-auto mb-[clamp(18px,2.4vw,28px)] w-[clamp(52px,6vw,84px)] text-brand opacity-25"
        >
            <path d="M7 7h4v4c0 3.3-2.7 6-6 6v-2c1.7 0 3-1.3 3-3H7V7zm10 0h4v4c0 3.3-2.7 6-6 6v-2c1.7 0 3-1.3 3-3h-1V7z" />
        </svg>
    );
}

export function Creed() {
    return (
        <Section top="none" bottom="sm">
            <Container className="max-w-[820px] text-center">
                <QuoteMark />

                {/*
                 * The page's own display serif, at the scale the section
                 * headings use. The emphasis mark applies as it does in every
                 * other heading on the site, so the turn of the line leans the
                 * way the design leans it.
                 */}
                <h2 className="voy-heading text-[clamp(28px,3.6vw,46px)]">
                    {withEmphasis(CREED)}
                </h2>

                {/* No rule under the heading: the mark above it already parts
                    this from what comes before, and two separators around one
                    short line is one more than the line needs. */}
                <p className="mx-auto mt-[clamp(20px,2.4vw,28px)] max-w-[62ch] text-[clamp(16px,1.5vw,19px)]/[1.62] text-balance text-ink-muted">
                    {LEAD}
                </p>
            </Container>
        </Section>
    );
}
