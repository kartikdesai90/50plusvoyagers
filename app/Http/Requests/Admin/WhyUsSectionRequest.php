<?php

namespace App\Http\Requests\Admin;

use App\Models\WhyUsSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * What the "Why travel with us" band is, described once.
 *
 * There is no store and no update to tell apart here: the band is one row that
 * is edited in place, so unlike the modules with a list this is one request
 * class rather than an abstract pair. What the two forms elsewhere disagree on —
 * whether a file must be present — is settled by asking whether one is already
 * stored, which is the same question with a simpler answer.
 *
 * The photograph is the one thing that is required outright, and only until
 * there is one. Everything else the band can do without: no points is a band
 * with no ticked list, no button is a band that draws none. Its title and the
 * line over it are not asked for at all — those are written into the front end,
 * beside the layout they title.
 */
class WhyUsSectionRequest extends FormRequest
{
    private const MAX_IMAGE = 10 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

    private const ACCEPTED = 'a JPG, PNG or WebP picture up to 10 MB';

    /** More than this and the list stops being a list and becomes the section. */
    private const MAX_POINTS = 8;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'points' => ['nullable', 'array', 'max:'.self::MAX_POINTS],
            'points.*' => ['nullable', 'string', 'max:160'],

            'button_text' => ['nullable', 'string', 'max:60'],
            'button_url' => ['nullable', 'string', 'max:2048'],

            'image_file' => [
                /* Required only until there is one. After that an editor
                   changing a single word is not made to re-upload a photograph
                   that has not changed. */
                $this->imageIsRequired() ? 'required' : 'nullable',
                'file',
                // Checked against the file's content, never its name.
                'mimetypes:'.self::IMAGE_TYPES,
                'max:'.self::MAX_IMAGE,
            ],

            'caption_heading' => ['nullable', 'string', 'max:160'],
            'caption_text' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'points' => 'points',
            'points.*' => 'point',
            'button_text' => 'button text',
            'button_url' => 'button address',
            'image_file' => 'picture',
            'caption_heading' => 'caption heading',
            'caption_text' => 'caption text',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'points.max' => 'That is more points than the list can show. Please keep it to '.self::MAX_POINTS.'.',
            'image_file.mimetypes' => 'That file is not '.self::ACCEPTED.'.',
            'image_file.max' => 'That file is too large. Please use '.self::ACCEPTED.'.',
            'image_file.required' => 'Choose the photograph this band shows.',
        ];
    }

    /** The one rule that needs the whole form to be true at once. */
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
            },
        ];
    }

    /**
     * The record's own fields, without the file — that is handled separately
     * because storing it can fail in ways a validated array cannot.
     *
     * @return array<string, mixed>
     */
    public function whyUsAttributes(): array
    {
        $validated = $this->validated();

        return [
            'points' => $this->cleanPoints($validated['points'] ?? []),

            'button_text' => $this->cleaned($validated['button_text'] ?? null),
            'button_url' => $this->cleaned($validated['button_url'] ?? null),


            'caption_heading' => $this->cleaned($validated['caption_heading'] ?? null),
            'caption_text' => $this->cleaned($validated['caption_text'] ?? null),
        ];
    }

    /** Whether the band has no photograph yet, so this save must bring one. */
    private function imageIsRequired(): bool
    {
        return blank(WhyUsSection::current()->image_path);
    }

    /**
     * The written points, with the blank rows dropped and the order kept.
     *
     * A row an editor added and then left empty is not an error to report, it
     * is a row they changed their mind about. Re-keyed on the way out, or a
     * gap in the middle would store an object where the list should be.
     *
     * @param  array<int, string|null>  $points
     * @return array<int, string>|null
     */
    private function cleanPoints(array $points): ?array
    {
        $cleaned = [];

        foreach ($points as $point) {
            $point = trim((string) $point);

            if ($point === '') {
                continue;
            }

            $cleaned[] = $point;
        }

        return $cleaned === [] ? null : $cleaned;
    }

    private function cleaned(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
