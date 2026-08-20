import type { CardInput, WhoWeAreCard } from '@/admin/features/who-we-are/types';

/**
 * Keys for rows that have no id yet.
 *
 * A counter rather than a random value: it never collides within a screen, it
 * is the same on every render, and nothing outside this module ever reads it.
 */
let nextKey = 0;

/** A card nobody has written yet, ready to be filled in. */
export function blankCard(): CardInput {
    return {
        id: null,
        title: '',
        body: '',
        is_active: true,
        image_url: null,
        image_file: null,
        key: `new-${(nextKey += 1)}`,
    };
}

/**
 * The stored cards, in the shape the form edits.
 *
 * One empty card where nothing has been written yet, so a fresh install opens
 * on something to fill in rather than on a button to find.
 */
export function toInput(cards: WhoWeAreCard[]): CardInput[] {
    if (cards.length === 0) {
        return [blankCard()];
    }

    return cards.map((card) => ({
        id: card.id,
        title: card.title,
        body: card.body ?? '',
        is_active: card.is_active,
        image_url: card.image_url,
        image_file: null,
        key: `card-${card.id}`,
    }));
}
