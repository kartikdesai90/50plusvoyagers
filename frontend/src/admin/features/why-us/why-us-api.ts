import { http } from '@/shared/lib/axios';
import type { WhyUsFiles, WhyUsInput, WhyUsSection } from '@/admin/features/why-us/types';

/**
 * The "Why travel with us" endpoints.
 *
 * Two, not five. The band is one row edited in place: there is nothing to list,
 * nothing to create and nothing to delete.
 *
 * The save is multipart, because it may carry a photograph. Sending JSON when
 * it carries none and multipart when it does would give the module two request
 * shapes and two ways for the server to read the same form.
 */

const BASE = '/admin/why-us';

type Envelope = { data: WhyUsSection };

export async function getWhyUs(): Promise<WhyUsSection> {
    const { data } = await http.get<Envelope>(BASE);

    return data.data;
}

function toFormData(input: WhyUsInput, files: WhyUsFiles): FormData {
    const form = new FormData();

    /* The list is appended below, a row at a time; everything else on the form
       is a string and crosses as one. */
    const { points, ...text } = input;

    for (const [key, value] of Object.entries(text)) {
        form.append(key, value);
    }

    /*
     * Indexed keys — `points[0]` — which is what PHP reads back as an array. A
     * JSON blob in one field would arrive as a string the server had to decode
     * before it could validate a single line inside it.
     *
     * The blank rows go too. Dropping them here would mean the browser and the
     * server each deciding what an empty row means, and only one of them can be
     * the place that decides it.
     */
    points.forEach((point, index) => form.append(`points[${index}]`, point));

    for (const [key, file] of Object.entries(files)) {
        if (file) form.append(key, file);
    }

    return form;
}

export async function saveWhyUs(input: WhyUsInput, files: WhyUsFiles): Promise<WhyUsSection> {
    const { data } = await http.post<Envelope>(BASE, toFormData(input, files));

    return data.data;
}
