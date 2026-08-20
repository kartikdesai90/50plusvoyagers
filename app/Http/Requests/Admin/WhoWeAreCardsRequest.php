<?php

namespace App\Http\Requests\Admin;

use App\Models\WhoWeAreCard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The four "Who we are" cards, saved as a set.
 *
 * One request for all of them rather than one per card, because that is how an
 * editor works with them: they sit side by side on the homepage and are read as
 * a group, so they are written as a group. It also settles the ordering without
 * a field for it — a card's position in this payload is its position on the
 * page, which is a rule nobody can get out of step with.
 *
 * A card already on the page arrives with its id. A new one arrives without.
 * One that has been taken out simply does not arrive, and the endpoint removes
 * it — which is what makes this a save of the set rather than of the rows in it.
 */
class WhoWeAreCardsRequest extends FormRequest
{
    private const MAX_IMAGE = 10 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

    private const ACCEPTED = 'a JPG, PNG or WebP picture up to 10 MB';

    /** The design shows four across; past this the row is a grid of its own. */
    private const MAX_CARDS = 8;

    /** The cards as they are stored, resolved once and read by two rules. */
    private ?Collection $stored = null;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * A switch arrives from a multipart form as the word "true", not as a
     * boolean, and `boolean` validation would reject it inside an array where
     * `$request->boolean()` would have handled it. Normalised once, here, so
     * every rule below and every reader after them sees a real boolean.
     */
    protected function prepareForValidation(): void
    {
        $cards = $this->input('cards');

        if (!is_array($cards)) {
            return;
        }

        foreach ($cards as $index => $card) {
            $cards[$index]['is_active'] = filter_var(
                $card['is_active'] ?? true,
                FILTER_VALIDATE_BOOLEAN,
            );
        }

        $this->merge(['cards' => $cards]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            /* Required rather than nullable: an empty set would be a homepage
               band with nothing in it, which is a mistake rather than a choice. */
            'cards' => ['required', 'array', 'min:1', 'max:'.self::MAX_CARDS],

            /* Present on a card that is already on the page, absent on a new
               one. Checked against the table so a stale tab cannot rewrite a
               card somebody else has since deleted. */
            'cards.*.id' => ['nullable', 'integer', Rule::exists('who_we_are_cards', 'id')],

            'cards.*.title' => ['required', 'string', 'max:80'],
            'cards.*.body' => ['nullable', 'string', 'max:500'],

            'cards.*.image_file' => [
                'nullable',
                'file',
                // Checked against the file's content, never its name.
                'mimetypes:'.self::IMAGE_TYPES,
                'max:'.self::MAX_IMAGE,
            ],

            'cards.*.is_active' => ['boolean'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'cards' => 'cards',
            'cards.*.title' => 'title',
            'cards.*.body' => 'text',
            'cards.*.image_file' => 'picture',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'cards.required' => 'The band needs at least one card.',
            'cards.max' => 'That is more cards than the band can show. Please keep it to '.self::MAX_CARDS.'.',
            'cards.*.title.required' => 'Every card needs a title.',
            'cards.*.image_file.mimetypes' => 'That file is not '.self::ACCEPTED.'.',
            'cards.*.image_file.max' => 'That file is too large. Please use '.self::ACCEPTED.'.',
        ];
    }

    /**
     * The rule each card has to satisfy on its own, once the whole set is known.
     *
     * A card is a picture with words under it, so it has to end this save with
     * a picture — brought now, or already stored against the id it arrived
     * with.
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                foreach ((array) $this->input('cards') as $index => $card) {
                    $bringsFile = $this->hasFile("cards.{$index}.image_file");
                    $hasStored = filled($this->storedCards()->get((int) ($card['id'] ?? 0))?->image_path);

                    if (!$bringsFile && !$hasStored) {
                        $validator->errors()->add(
                            "cards.{$index}.image_file",
                            'Choose a picture for this card.',
                        );
                    }
                }
            },
        ];
    }

    /**
     * The set as the endpoint should write it: each card's own fields, in the
     * order they arrived, with the position settled.
     *
     * The files are not here — storing one can fail in ways a validated array
     * cannot, so the endpoint handles them itself, index by index.
     *
     * @return array<int, array<string, mixed>>
     */
    public function cardSet(): array
    {
        $cards = [];

        foreach ($this->validated()['cards'] as $order => $card) {
            $cards[] = [
                'id' => isset($card['id']) ? (int) $card['id'] : null,
                'attributes' => [
                    'title' => trim($card['title']),
                    'body' => $this->cleaned($card['body'] ?? null),
                    'is_active' => (bool) ($card['is_active'] ?? true),
                    /* Position in the payload is position on the page. */
                    'display_order' => $order,
                ],
            ];
        }

        return $cards;
    }

    /** @return Collection<int, WhoWeAreCard> */
    public function storedCards(): Collection
    {
        return $this->stored ??= WhoWeAreCard::query()->get()->keyBy('id');
    }

    private function cleaned(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
