import type { Feedback, FeedbackFiles, FeedbackInput } from '@/admin/features/feedback/types';

/**
 * What the form starts as when feedback is being added.
 *
 * A written quote, active, unfeatured — the testimonial an editor is most
 * likely to be typing, so the common case needs the fewest decisions.
 */
export const blankFeedback: FeedbackInput = {
    type: 'text',
    customer_name: '',
    customer_location: '',
    feedback_text: '',
    video_url: '',
    tour_id: '',
    is_featured: false,
    is_active: true,
    display_order: 0,
};

export const noFiles: FeedbackFiles = {
    video_file: null,
    thumbnail_file: null,
    photo_file: null,
};

/** An existing record, in the shape the form edits. */
export function toInput(feedback: Feedback): FeedbackInput {
    return {
        type: feedback.type,
        customer_name: feedback.customer_name,
        customer_location: feedback.customer_location ?? '',
        feedback_text: feedback.feedback_text ?? '',
        video_url: feedback.video_url ?? '',
        tour_id: feedback.tour_id === null ? '' : String(feedback.tour_id),
        is_featured: feedback.is_featured,
        is_active: feedback.is_active,
        display_order: feedback.display_order,
    };
}
