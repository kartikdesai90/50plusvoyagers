<?php

namespace App\Http\Requests\Admin;

use App\Models\Tour;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * What a tour is, described once for both creating and editing.
 *
 * The two differ in exactly one place — which row a tour code may already
 * belong to — so they share this and say only that.
 */
abstract class TourRequest extends FormRequest
{
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
        $this->merge(array_filter([
            'tour_code' => $this->has('tour_code')
                ? trim($this->string('tour_code')->toString())
                : null,
            'tour_name' => $this->has('tour_name')
                ? trim($this->string('tour_name')->toString())
                : null,
        ], fn ($value) => $value !== null));
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
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'tour_code.unique' => 'That tour code is already in use.',
        ];
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
        return [
            'tour_code' => $this->string('tour_code')->toString(),
            'tour_name' => $this->string('tour_name')->toString(),
            'end_date' => $this->date('end_date'),
        ];
    }
}
