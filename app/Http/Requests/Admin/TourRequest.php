<?php

namespace App\Http\Requests\Admin;

use App\Models\Tour;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * What a tour is, described once for both creating and editing.
 *
 * The two differ in exactly one place — which row a tour code may already
 * belong to — so they share this and say only that.
 */
abstract class TourRequest extends FormRequest
{
    private const MAX_IMAGE = 10 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

    public function authorize(): bool
    {
        return true;
    }

    /** The tour being edited, or null while one is being created. */
    abstract protected function existing(): ?Tour;

    /**
     * Trim before anything is checked, not after.
     *
     * The CRM's own data has at least one code with a leading space
     * (`' Kinnaur06062026'`), and a space is invisible in a form field. Trimming
     * here rather than on the way out means the uniqueness rule compares the
     * value we are actually going to store — otherwise `'Coorg30052026'` and
     * `' Coorg30052026'` are two different codes to the database and one to a
     * reader.
     */
    protected function prepareForValidation(): void
    {
        $trimmed = [];

        foreach (['tour_code', 'tour_name', 'slug'] as $field) {
            if (!$this->has($field)) {
                continue;
            }

            $value = trim($this->string($field)->toString());

            /*
             * An emptied address becomes null, not ''. Two tours with '' would
             * collide on the unique index — the second save would fail with a
             * database error rather than a message about the field.
             */
            $trimmed[$field] = ($field === 'slug' && $value === '') ? null : $value;
        }

        $this->merge($trimmed);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            /*
             * The CRM's identifier for a departure. Unique because a duplicate
             * would make the eventual join to `tb_group_tour` ambiguous, and
             * because the CRM's own column is unique.
             *
             * Lengths match the CRM's column widths exactly rather than a
             * round number, so a value this panel accepts is always a value the
             * CRM's own table can hold.
             */
            'tour_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('tours', 'tour_code')->ignore($this->existing()?->getKey()),
            ],

            'tour_name' => ['required', 'string', 'max:200'],

            // Nullable exactly as the CRM has it: a tour can be recorded before
            // its end date is settled.
            'end_date' => ['nullable', 'date'],

            /*
             * The page. All optional: a tour can be recorded from the CRM long
             * before anybody writes the page for it, and `published` is what
             * says the writing is done.
             */
            'slug' => [
                'nullable',
                'string',
                'max:160',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('tours', 'slug')->ignore($this->existing()?->getKey()),
            ],
            'legacy_url' => ['nullable', 'string', 'max:2048'],
            'page_title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:20'],
            'summary' => ['nullable', 'string', 'max:5000'],
            'ribbon_text' => ['nullable', 'string', 'max:80'],
            'visa_content' => ['nullable', 'string', 'max:20000'],
            'booking_fee' => ['nullable', 'integer', 'min:0'],
            'balance_due_days' => ['nullable', 'integer', 'min:0', 'max:365'],

            /*
             * Carried across verbatim from the existing HTML — the client was
             * explicit that meta and H1 text must survive the move. Lengths are
             * generous rather than "best practice": the job here is to hold
             * what the old pages already say, not to correct it.
             */
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'og_title' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'string', 'max:2048'],

            'status' => ['nullable', Rule::in([Tour::STATUS_DRAFT, Tour::STATUS_PUBLISHED])],
            'display_order' => ['nullable', 'integer', 'min:0'],

            'route_map_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],
            'og_image_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],

            /*
             * The tour's own main picture — what the card leads with and what
             * the page opens on. Its own upload rather than a flag on one of
             * the carousel's rows: a tour's lead image is not necessarily one
             * of its carousel photographs, and an editor had no way to say so.
             */
            'image_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'tour_code.unique' => 'That tour code is already in use.',
            'slug.unique' => 'That address is already in use by another tour.',
            'slug.regex' => 'An address may use lowercase letters, numbers and hyphens only.',
        ];
    }

    /**
     * A tour cannot be published without an address.
     *
     * Stated here rather than left to the database, because "published with no
     * slug" is a row the public scope silently skips — the editor would press
     * Publish, see it save, and never find the page.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $publishing = $this->input('status') === Tour::STATUS_PUBLISHED;
            $slug = trim((string) $this->input('slug', $this->existing()?->slug));

            if ($publishing && $slug === '') {
                $validator->errors()->add('slug', 'A published tour needs an address.');
            }
        });
    }

    /**
     * The tour's fields, ready to fill a model with.
     *
     * Already trimmed by `prepareForValidation`, so what is stored is exactly
     * what was validated.
     *
     * @return array<string, mixed>
     */
    public function tourAttributes(): array
    {
        $validated = $this->validated();

        /*
         * Only what was sent. A screen that edits the CRM fields alone must not
         * blank the page fields it never showed, so a key that is absent from
         * the request is absent from the update — which is not the same as
         * being sent empty.
         */
        $page = array_intersect_key($validated, array_flip([
            'slug', 'legacy_url', 'page_title', 'subtitle', 'region', 'summary',
            'ribbon_text', 'visa_content', 'booking_fee', 'balance_due_days',
            'meta_title', 'meta_description', 'meta_keywords',
            'og_title', 'og_description', 'canonical_url',
            'status', 'display_order',
        ]));

        return [
            'tour_code' => $this->string('tour_code')->toString(),
            'tour_name' => $this->string('tour_name')->toString(),
            'end_date' => $this->date('end_date'),
            ...$page,
        ];
    }
}
