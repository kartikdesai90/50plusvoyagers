import { http } from '@/shared/lib/axios';
import type { CardInput, WhoWeAreCard } from '@/admin/features/who-we-are/types';

/**
 * The "Who we are" endpoints.
 *
 * Two, not five, though these are rows rather than a single record: the cards
 * are read as a group and are written as a group. A save sends the whole band —
 * what is in it is what the homepage becomes, and a card left out of it is a
 * card taken off the page.
 */

const BASE = '/admin/who-we-are';

type Envelope = { data: WhoWeAreCard[] };

export async function getWhoWeAreCards(): Promise<WhoWeAreCard[]> {
    const { data } = await http.get<Envelope>(BASE);

    return data.data;
}

/**
 * The set as multipart, a row at a time.
 *
 * Indexed keys — `cards[0][title]` — which is what PHP reads back as an array
 * of arrays, files included. The order of the rows is the order of the band, so
 * nothing carries a position: the index is the position.
 */
function toFormData(cards: CardInput[]): FormData {
    const form = new FormData();

    cards.forEach((card, index) => {
        const at = `cards[${index}]`;

        /* Sent only for a card that already exists. A new one is new by having
           no id, rather than by carrying an empty one the server has to read. */
        if (card.id !== null) form.append(`${at}[id]`, String(card.id));

        form.append(`${at}[title]`, card.title);
        form.append(`${at}[body]`, card.body);
        form.append(`${at}[is_active]`, card.is_active ? 'true' : 'false');

        /* Absent where the card keeps the picture it already has. */
        if (card.image_file) form.append(`${at}[image_file]`, card.image_file);
    });

    return form;
}

export async function saveWhoWeAreCards(cards: CardInput[]): Promise<WhoWeAreCard[]> {
    const { data } = await http.post<Envelope>(BASE, toFormData(cards));

    return data.data;
}
