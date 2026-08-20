<?php

namespace App\Http\Requests\Admin;

use App\Enums\FeedbackType;
use App\Models\Feedback;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

/**
 * What a piece of feedback is, described once for both writing and rewriting.
 *
 * Two of these rules depend on which kind it is, and both are checked here
 * rather than in the screen: a written quote with nothing written in it, and a
 * filmed one with no film, are both records that would render as an empty space
 * on the homepage — which is the one place nobody is watching for them.
 */
abstract class FeedbackRequest extends FormRequest
{
    /** In kilobytes, as Laravel's `max` rule counts them. */
    private const MAX_VIDEO = 50 * 1024;

    private const MAX_IMAGE = 10 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

    private const VIDEO_TYPES = 'video/mp4,video/webm';

    public function authorize(): bool
    {
        return true;
    }

    /** The record being rewritten, or null while one is being created. */
    abstract protected function existing(): ?Feedback;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', new Enum(FeedbackType::class)],

            'customer_name' => ['required', 'string', 'max:120'],
            'customer_location' => ['nullable', 'string', 'max:120'],

            // Only a written one needs words; the rule says so rather than
            // leaving it to whoever fills the form in.
            'feedback_text' => ['nullable', 'required_if:type,text', 'string', 'max:2000'],

            'video_url' => ['nullable', 'url', 'max:2048'],
            'video_file' => ['nullable', 'file', 'mimetypes:'.self::VIDEO_TYPES, 'max:'.self::MAX_VIDEO],

            'thumbnail_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],
            'photo_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],

            'tour_id' => ['nullable', 'integer', 'min:1'],

            'is_featured' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'customer_name' => 'name',
            'customer_location' => 'where they are from',
            'feedback_text' => 'what they said',
            'video_url' => 'video link',
            'video_file' => 'video',
            'thumbnail_file' => 'thumbnail',
            'photo_file' => 'photo',
            'display_order' => 'order',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'Whose feedback is this? Give their name.',
            'feedback_text.required_if' => 'Write what the traveller said.',
            'video_file.mimetypes' => 'That file is not an MP4 or WebM video.',
            'video_file.max' => 'That video is too large. Please keep it under 50 MB.',
            'thumbnail_file.mimetypes' => 'A thumbnail must be a JPG, PNG or WebP picture.',
            'photo_file.mimetypes' => 'A photo must be a JPG, PNG or WebP picture.',
            'thumbnail_file.max' => 'That picture is too large. Please keep it under 10 MB.',
            'photo_file.max' => 'That picture is too large. Please keep it under 10 MB.',
        ];
    }

    /**
     * The rule that needs the whole form at once: a film has to come from
     * somewhere. Either half will do — a link or a file — and an existing
     * record already carrying one counts, so editing the name of a filmed
     * testimonial does not demand the film again.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($this->chosenType() !== FeedbackType::Video) {
                    return;
                }

                $carriesFilm = $this->hasFile('video_file')
                    || filled($this->input('video_url'))
                    || filled($this->existing()?->video_path)
                    || filled($this->existing()?->video_url);

                if (!$carriesFilm) {
                    $validator->errors()->add(
                        'video_url',
                        'A video testimonial needs a film — paste a link to it, or upload the file.',
                    );
                }
            },
        ];
    }

    protected function chosenType(): FeedbackType
    {
        return FeedbackType::tryFrom((string) $this->input('type'))
            ?? $this->existing()?->type
            ?? FeedbackType::Text;
    }

    /**
     * The record's own fields, without the files — those are handled
     * separately, because storing one can fail in ways a validated array cannot.
     *
     * Switching kind clears what the other kind carried, so a record never
     * keeps a film it no longer shows or a quote nobody will read.
     *
     * @return array<string, mixed>
     */
    public function feedbackAttributes(): array
    {
        $validated = $this->validated();
        $type = $this->chosenType();

        return [
            'type' => $type,
            'customer_name' => $validated['customer_name'],
            'customer_location' => $validated['customer_location'] ?? null,
            'feedback_text' => $type === FeedbackType::Text
                ? ($validated['feedback_text'] ?? null)
                : null,
            'video_url' => $type === FeedbackType::Video
                ? ($validated['video_url'] ?? null)
                : null,

            /*
             * Only where the form actually carried it. The tour picker is
             * hidden until the Tours module exists, so a save does not mention
             * it — and `?? null` would have read that silence as an instruction
             * to erase whatever was already stored.
             */
            ...array_intersect_key($validated, array_flip(['tour_id'])),

            'is_featured' => $this->boolean('is_featured'),
            'is_active' => $this->boolean('is_active'),
            'display_order' => $validated['display_order'] ?? 0,
        ];
    }
}
