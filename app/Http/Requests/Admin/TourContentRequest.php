<?php

namespace App\Http\Requests\Admin;

use App\Models\TourBookingStep;
use App\Models\TourItineraryDay;
use App\Models\TourListItem;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The seven repeating lists of a tour page, saved as one set.
 *
 * One request for all of them rather than one per list, because that is how an
 * editor works with a tour page: the highlights, the day-by-day, what the price
 * covers and what it does not are read together and are written together. It
 * also settles the ordering without a field for it — a row's position in this
 * payload is its position on the page, which is a rule nobody can get out of
 * step with.
 *
 * This is the same shape {@see WhoWeAreCardsRequest} uses for the homepage
 * cards, and for the same reasons. A row already on the page arrives with its
 * id; a new one arrives without; one the editor removed simply does not arrive,
 * and the endpoint deletes it.
 *
 * Every list is `present` rather than `required`. A tour genuinely may have no
 * highlights — Coorg has none — so an empty list is a real answer and must be
 * distinguishable from a screen that never sent the field at all.
 */
class TourContentRequest extends FormRequest
{
    /**
     * Where each list stops being something a page can show.
     *
     * Generous rather than tight: the longest of the old pages runs to thirteen
     * itinerary days and sixteen exclusions, and a limit that argued with real
     * content would be a limit that gets raised the first time it is met.
     */
    private const MAX_ROWS = 60;

    /** Matches `text` in the content tables — long enough for a day's prose. */
    private const MAX_BODY = 20000;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * The five flat lists, and the table each is stored in.
     *
     * Written once so the rules, the reader and the endpoint cannot disagree
     * about which kind a list carries.
     *
     * @var array<string, array{model: class-string, kind: string}>
     */
    public const FLAT_LISTS = [
        'highlights' => ['model' => TourListItem::class, 'kind' => TourListItem::KIND_HIGHLIGHT],
        'inclusions' => ['model' => TourListItem::class, 'kind' => TourListItem::KIND_INCLUSION],
        'exclusions' => ['model' => TourListItem::class, 'kind' => TourListItem::KIND_EXCLUSION],
        'booking_steps' => ['model' => TourBookingStep::class, 'kind' => TourBookingStep::KIND_BOOKING],
        'documents' => ['model' => TourBookingStep::class, 'kind' => TourBookingStep::KIND_DOCUMENTS],
        'guidelines' => ['model' => TourBookingStep::class, 'kind' => TourBookingStep::KIND_GUIDELINES],
    ];

    /**
     * Drop the rows an editor started and thought better of.
     *
     * An empty row is somebody who pressed Add and changed their mind, not
     * somebody who made a mistake — the same judgement {@see TextListField}
     * makes on the other side of the wire. Dropping them here rather than
     * reporting them means the editor is never blocked by a blank line they
     * cannot see the problem with.
     *
     * It runs before validation so the `max` counts, and the positions that
     * become `display_order`, are both computed on what will actually be
     * stored.
     */
    protected function prepareForValidation(): void
    {
        $cleaned = [];

        foreach (array_keys(self::FLAT_LISTS) as $list) {
            if (!is_array($this->input($list))) {
                continue;
            }

            /* Markup first, then the emptiness test — see `asText()` for why
               that order is the whole point. */
            $rows = array_map(
                fn ($row) => is_array($row)
                    ? [...$row, 'body' => $this->asText($row['body'] ?? null)]
                    : $row,
                $this->input($list),
            );

            $cleaned[$list] = array_values(array_filter(
                $rows,
                fn ($row) => is_array($row) && $row['body'] !== '',
            ));
        }

        if (is_array($this->input('itinerary'))) {
            $days = array_map(
                fn ($row) => is_array($row) ? [
                    ...$row,
                    'heading' => $this->asText($row['heading'] ?? null),
                    'title' => $this->asText($row['title'] ?? null),
                    'body' => $this->asText($row['body'] ?? null),
                    'stay' => $this->asText($row['stay'] ?? null),
                    'meals' => $this->asText($row['meals'] ?? null),
                ] : $row,
                $this->input('itinerary'),
            );

            /*
             * A day is kept on its heading alone. The prose may genuinely be
             * written later — "Day 7: At leisure" is a complete day — so an
             * empty body is not what makes a row abandoned.
             */
            $cleaned['itinerary'] = array_values(array_filter(
                $days,
                fn ($row) => is_array($row) && $row['heading'] !== '',
            ));
        }

        $this->merge($cleaned);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $rules = [];

        foreach (array_keys(self::FLAT_LISTS) as $list) {
            /*
             * `present` rather than `required`: a tour with no highlights is an
             * ordinary tour, and an empty array is the editor saying so. What
             * must not happen is the key being absent, because then an empty
             * list and an unsent list would look the same and a save could
             * silently wipe a list the screen never showed.
             */
            $rules[$list] = ['present', 'array', 'max:'.self::MAX_ROWS];

            /* Checked against the table so a stale tab cannot rewrite a row
               somebody else has since deleted. Scoped to this tour below. */
            $rules["{$list}.*.id"] = ['nullable', 'integer'];
            $rules["{$list}.*.body"] = ['required', 'string', 'max:'.self::MAX_BODY];
        }

        $rules['itinerary'] = ['present', 'array', 'max:'.self::MAX_ROWS];
        $rules['itinerary.*.id'] = ['nullable', 'integer'];

        /*
         * The one field a day cannot do without. Everything else on a day is
         * genuinely optional — the old pages have days with no hotel named and
         * days with no meals listed.
         */
        $rules['itinerary.*.heading'] = ['required', 'string', 'max:255'];
        $rules['itinerary.*.title'] = ['nullable', 'string', 'max:255'];
        $rules['itinerary.*.body'] = ['nullable', 'string', 'max:'.self::MAX_BODY];
        $rules['itinerary.*.stay'] = ['nullable', 'string', 'max:255'];
        $rules['itinerary.*.meals'] = ['nullable', 'string', 'max:255'];

        /*
         * Normally empty. The real date is counted from the CRM's departure
         * plus the day number — see {@see TourItineraryDay::dateFrom()} — and
         * this is the override for the day that genuinely needs one.
         */
        $rules['itinerary.*.day_date'] = ['nullable', 'date'];

        return $rules;
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'highlights.*.body' => 'highlight',
            'inclusions.*.body' => 'inclusion',
            'exclusions.*.body' => 'exclusion',
            'booking_steps.*.body' => 'booking step',
            'documents.*.body' => 'document',
            'guidelines.*.body' => 'guideline',
            'itinerary.*.heading' => 'day heading',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'itinerary.*.heading.required' => 'Every day needs a heading, e.g. “Day 1: Arrive Porto”.',
            '*.max' => 'That is more rows than the page can show. Please keep it to '.self::MAX_ROWS.'.',
        ];
    }

    /**
     * One flat list, ready for the endpoint to write.
     *
     * The `kind` and the `display_order` are settled here rather than trusted
     * from the payload: the kind is a fact about which list this is, and the
     * order is the position the editor put the row in. Neither is the browser's
     * to decide.
     *
     * @return list<array{id: ?int, attributes: array<string, mixed>}>
     */
    public function listRows(string $list): array
    {
        $kind = self::FLAT_LISTS[$list]['kind'];
        $isNumbered = self::FLAT_LISTS[$list]['model'] === TourBookingStep::class;

        $rows = [];

        foreach ($this->validated()[$list] ?? [] as $order => $row) {
            $attributes = [
                'kind' => $kind,
                'content' => trim((string) $row['body']),
                'display_order' => $order,
            ];

            /*
             * The numbered lists print their number on the page, so it has to
             * agree with the order rather than being a second opinion on it.
             * Counted from one, because that is what a reader sees.
             */
            if ($isNumbered) {
                $attributes['step_number'] = $order + 1;
            }

            $rows[] = [
                'id' => isset($row['id']) ? (int) $row['id'] : null,
                'attributes' => $attributes,
            ];
        }

        return $rows;
    }

    /**
     * The day-by-day, ready for the endpoint to write.
     *
     * `day_number` is the row's position rather than anything typed, for the
     * reason the table has a unique index on it: a tour cannot have two day
     * fours, and the surest way to guarantee that is to never let two rows
     * claim the same number in the first place.
     *
     * @return list<array{id: ?int, attributes: array<string, mixed>}>
     */
    public function itineraryRows(): array
    {
        $days = [];

        foreach ($this->validated()['itinerary'] ?? [] as $order => $day) {
            $days[] = [
                'id' => isset($day['id']) ? (int) $day['id'] : null,
                'attributes' => [
                    'day_number' => $order + 1,
                    'heading' => trim((string) $day['heading']),
                    'title' => $this->cleaned($day['title'] ?? null),
                    /* `content` is NOT NULL on the table, so an unwritten day
                       stores an empty string rather than failing the save. */
                    'content' => trim((string) ($day['body'] ?? '')),
                    'stay' => $this->cleaned($day['stay'] ?? null),
                    'meals' => $this->cleaned($day['meals'] ?? null),
                    'day_date' => $this->cleaned($day['day_date'] ?? null),
                    'display_order' => $order,
                ],
            ];
        }

        return $days;
    }

    /**
     * The words out of whatever was pasted in.
     *
     * These columns are named `content` and hold prose, not documents. The
     * importer already stores plain text — every field it writes comes from
     * `textContent` — and the public page strips any markup it finds before
     * rendering, deliberately: injecting editor-typed content with
     * `dangerouslySetInnerHTML` would be an XSS hole on every tour page for the
     * sake of formatting the design does not use.
     *
     * So the tags an editor pastes from Word are never rendered — they are
     * stored, shipped over the wire, and thrown away at the far end. Cleaning
     * them here means the database holds what the page will actually show.
     *
     * This runs *before* the emptiness filter, which is the point rather than
     * an implementation detail: Word's empty paragraph is `<p>&nbsp;</p>`, and
     * a row holding only that is a row an editor believes is empty. Filtering
     * first would keep it — as a lone space — and print a blank bullet.
     *
     * Mirrors `plainText()` in the front end's `tour-view.ts`. The two are the
     * same rule applied at both ends: what is stored and what is shown agree.
     */
    private function asText(?string $value): string
    {
        $value = (string) $value;

        if ($value === '') {
            return '';
        }

        /* A closing paragraph, list item or heading is where a line ends. */
        $value = preg_replace('#</(p|div|li|h[1-6])\s*>#i', "\n", $value) ?? $value;
        $value = preg_replace('#<br\s*/?>#i', "\n", $value) ?? $value;

        /* Script and style carry their contents with them; stripping the tags
           alone would leave the code behind as text. */
        $value = preg_replace('#<(script|style)\b[^>]*>.*?</\1\s*>#is', '', $value) ?? $value;

        $value = preg_replace('/<[^>]+>/', '', $value) ?? $value;

        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        /* A non-breaking space is a space, and Word pastes a great many. */
        $value = str_replace(["\u{00A0}", "\r\n", "\r"], [' ', "\n", "\n"], $value);

        /* Collapse the blank lines the tag replacements leave behind. */
        $value = preg_replace('/[ \t]+/', ' ', $value) ?? $value;
        $value = preg_replace('/\n{3,}/', "\n\n", $value) ?? $value;
        $value = preg_replace('/ *\n */', "\n", $value) ?? $value;

        return trim($value);
    }

    private function cleaned(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
