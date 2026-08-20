import { Fragment, isValidElement, type ReactNode } from 'react';

/**
 * The one piece of formatting a heading may carry.
 *
 * The approved design sets the turn of a heading — one word, or the phrase the
 * sentence rests on — in the brand italic, and leaves the rest in the ink serif.
 * Asterisks mark it: `See the world like you *mean* it.` They are the smallest
 * notation that keeps the design, and the only one safe to put in a database
 * field. Making the field plain text would quietly drop the treatment; letting
 * an editor write HTML would open every heading to anything at all.
 *
 * What the marked span actually looks like is `.voy-emphasis`, in the
 * stylesheet with the rest of the type. A heading is not the place to decide
 * what the brand italic is.
 */
export function withEmphasis(text: string): ReactNode {
    return text.split(/\*([^*]+)\*/g).map((part, index) =>
        index % 2 === 1 ? (
            <em key={index} className="voy-emphasis">
                {part}
            </em>
        ) : (
            <Fragment key={index}>{part}</Fragment>
        ),
    );
}

/**
 * The same, for anything a heading might have been given.
 *
 * Headings take `ReactNode`, and most of them are handed a plain string with
 * asterisks in it. Some are handed markup instead — a heading that already
 * decided its own emphasis — and that is passed through untouched rather than
 * being searched for a notation it was never written in.
 */
export function emphasised(content: ReactNode): ReactNode {
    if (typeof content === 'string') return withEmphasis(content);

    /*
     * JSX text with an entity in it — `What &quot;fully hosted&quot; means` —
     * reaches a component as an array of strings rather than as one. Joining
     * them is what lets a heading written that way still carry the mark.
     */
    if (Array.isArray(content) && content.every((part) => typeof part === 'string')) {
        return withEmphasis(content.join(''));
    }

    if (isValidElement(content)) return content;

    return content;
}
