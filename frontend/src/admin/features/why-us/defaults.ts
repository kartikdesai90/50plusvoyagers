import type { WhyUsFiles, WhyUsInput, WhyUsSection } from '@/admin/features/why-us/types';

/** Nothing chosen yet. */
export const noFiles: WhyUsFiles = {
    image_file: null,
};

/** The stored band, in the shape the form edits. */
export function toInput(section: WhyUsSection): WhyUsInput {
    return {
        /* An empty row to write in where none have been written yet, so the
           list reads as something to fill rather than as a button to find. */
        points: section.points.length > 0 ? section.points : [''],

        button_text: section.button_text ?? '',
        button_url: section.button_url ?? '',


        caption_heading: section.caption_heading ?? '',
        caption_text: section.caption_text ?? '',
    };
}
