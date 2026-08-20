<?php

namespace App\Http\Requests\Admin;

use App\Enums\SectionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

/**
 * What a homepage band is, described once for both writing and rewriting.
 *
 * A band shows a picture. It used to be able to show a film instead, and the
 * file rules were built from whichever the editor had chosen; with one kind
 * left they are simply stated, and anything that is not a picture is refused by
 * its content rather than by its file name — an extension is a claim, not
 * evidence.
 */
abstract class HeroBannerRequest extends FormRequest
{
    private const MAX_IMAGE = 10 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

    private const ACCEPTED = 'a JPG, PNG or WebP picture up to 10 MB';

    public function authorize(): bool
    {
        return true;
    }

    /** Whether a file has to be present, which is the only thing the two forms disagree on. */
    abstract protected function fileIsRequired(): bool;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'section_type' => ['required', new Enum(SectionType::class)],

            'media_file' => [
                $this->fileIsRequired() ? 'required' : 'nullable',
                'file',
                // Checked against the file's content, never its name.
                'mimetypes:'.self::IMAGE_TYPES,
                'max:'.self::MAX_IMAGE,
            ],


            'label' => ['nullable', 'string', 'max:120'],
            'heading' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],

            'button_text' => ['nullable', 'string', 'max:60'],
            'button_url' => ['nullable', 'string', 'max:2048'],

            /* The words printed over the photograph. Hero bands only — a
               banner has no overlay, and leaving these empty is how it says so. */
            'caption_label' => ['nullable', 'string', 'max:120'],
            'caption_heading' => ['nullable', 'string', 'max:255'],
            'caption_text' => ['nullable', 'string', 'max:500'],
            'caption_button_text' => ['nullable', 'string', 'max:60'],
            'caption_button_url' => ['nullable', 'string', 'max:2048'],

            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'section_type' => 'section',
            'media_file' => 'file',
            'label' => 'label',
            'button_text' => 'button text',
            'button_url' => 'button address',
            'caption_label' => 'caption badge',
            'caption_heading' => 'caption heading',
            'caption_text' => 'caption text',
            'caption_button_text' => 'caption link text',
            'caption_button_url' => 'caption link address',
            'display_order' => 'order',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'media_file.mimetypes' => 'That file is not '.self::ACCEPTED.'.',
            'media_file.max' => 'That file is too large. Please use '.self::ACCEPTED.'.',
            'media_file.required' => 'Choose a picture to show in this band.',
            'heading.required' => 'Write the heading that appears over the media.',
        ];
    }

    /**
     * Two rules that need the whole form to be true at once.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                // A button with only half of itself is either a word that does
                // nothing or a destination nobody can see.
                if (filled($this->input('button_text')) xor filled($this->input('button_url'))) {
                    $validator->errors()->add(
                        'button_url',
                        'A button needs both its text and its address. Fill in both, or leave both empty.',
                    );
                }

                // The same rule for the link over the photograph.
                if (filled($this->input('caption_button_text')) xor filled($this->input('caption_button_url'))) {
                    $validator->errors()->add(
                        'caption_button_url',
                        'A link needs both its text and its address. Fill in both, or leave both empty.',
                    );
                }
            },
        ];
    }

    /**
     * The record's own fields, without the file — that is handled separately
     * because storing it can fail in ways a validated array cannot.
     *
     * @return array<string, mixed>
     */
    public function bandAttributes(): array
    {
        $validated = $this->validated();

        return [
            'section_type' => $validated['section_type'],
            'label' => $validated['label'] ?? null,
            'heading' => $validated['heading'],
            'description' => $validated['description'] ?? null,
            'button_text' => $validated['button_text'] ?? null,
            'button_url' => $validated['button_url'] ?? null,
            'caption_label' => $validated['caption_label'] ?? null,
            'caption_heading' => $validated['caption_heading'] ?? null,
            'caption_text' => $validated['caption_text'] ?? null,
            'caption_button_text' => $validated['caption_button_text'] ?? null,
            'caption_button_url' => $validated['caption_button_url'] ?? null,
            'is_active' => $this->boolean('is_active'),
            'display_order' => $validated['display_order'] ?? 0,
        ];
    }
}
