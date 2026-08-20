<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * What a gallery photograph is, described once for both writing and rewriting.
 */
abstract class GalleryItemRequest extends FormRequest
{
    private const MAX_IMAGE = 10 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

    public function authorize(): bool
    {
        return true;
    }

    /** Whether a file has to be present, which is all the two forms disagree on. */
    abstract protected function fileIsRequired(): bool;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'caption' => ['nullable', 'string', 'max:1000'],

            'image_file' => [
                $this->fileIsRequired() ? 'required' : 'nullable',
                'file',
                // Checked against the file's content, never its name — an
                // extension is a claim, not evidence.
                'mimetypes:'.self::IMAGE_TYPES,
                'max:'.self::MAX_IMAGE,
            ],

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
            'image_file' => 'photograph',
            'caption' => 'caption',
            'display_order' => 'order',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'title.required' => 'Give the photograph a title.',
            'image_file.required' => 'Choose a photograph to add.',
            'image_file.mimetypes' => 'That file is not a JPG, PNG or WebP picture.',
            'image_file.max' => 'That picture is too large. Please keep it under 10 MB.',
        ];
    }

    /**
     * The record's own fields, without the file — that is handled separately,
     * because storing it can fail in ways a validated array cannot.
     *
     * @return array<string, mixed>
     */
    public function galleryAttributes(): array
    {
        $validated = $this->validated();

        return [
            'title' => $validated['title'],
            'caption' => $validated['caption'] ?? null,
            'tour_id' => $validated['tour_id'] ?? null,
            'is_featured' => $this->boolean('is_featured'),
            'is_active' => $this->boolean('is_active'),
            'display_order' => $validated['display_order'] ?? 0,
        ];
    }
}
