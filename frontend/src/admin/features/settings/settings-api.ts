import { http } from '@/shared/lib/axios';
import type { SettingsFiles, SettingsInput, SiteSettings } from '@/admin/features/settings/types';

/**
 * The settings endpoints.
 *
 * Two, not five. The settings are one row edited in place: there is nothing to
 * list, nothing to create and nothing to delete.
 *
 * The save is multipart, because it may carry a logo, a favicon or a sharing
 * image. Sending JSON when it carries none and multipart when it does would
 * give the module two request shapes and two ways for the server to read the
 * same form.
 */

const BASE = '/admin/settings';

type Envelope = { data: SiteSettings };

export async function getSettings(): Promise<SiteSettings> {
    const { data } = await http.get<Envelope>(BASE);

    return data.data;
}

/**
 * Repeatable rows cross as indexed keys — `footer_links[0][label]` — which is
 * what PHP reads back as an array of arrays. A JSON blob in one field would
 * arrive as a string the server had to decode before it could validate a single
 * address inside it.
 */
function appendPairs(
    form: FormData,
    key: keyof SettingsInput,
    pairs: { label: string; url: string }[],
) {
    pairs.forEach((pair, index) => {
        form.append(`${key}[${index}][label]`, pair.label);
        form.append(`${key}[${index}][url]`, pair.url);
    });
}

function toFormData(input: SettingsInput, files: SettingsFiles): FormData {
    const form = new FormData();

    /* The two repeatable lists are appended below, a row at a time; everything
       else on the form is a string and crosses as one. */
    const { other_socials: socials, footer_links: footerLinks, ...text } = input;

    for (const [key, value] of Object.entries(text)) {
        form.append(key, value);
    }

    appendPairs(form, 'other_socials', socials);
    appendPairs(form, 'footer_links', footerLinks);

    for (const [key, file] of Object.entries(files)) {
        if (file) form.append(key, file);
    }

    return form;
}

export async function saveSettings(
    input: SettingsInput,
    files: SettingsFiles,
): Promise<SiteSettings> {
    const { data } = await http.post<Envelope>(BASE, toFormData(input, files));

    return data.data;
}
