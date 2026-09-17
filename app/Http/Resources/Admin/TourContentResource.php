<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\Site\TourPageResource;
use App\Models\Tour;
use App\Models\TourBookingStep;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A tour's repeating content, as its editor sees it.
 *
 * The same seven lists {@see TourPageResource} sends a
 * visitor, with one difference that is the whole reason this is a separate
 * resource: every row carries its `id`. The public page has no use for one — it
 * prints the words — but an editor's screen must be able to say "this row, the
 * one that already exists" when it saves, or every save would delete the set
 * and write it again, and the rows would change identity under anything holding
 * a reference to them.
 *
 * A list with no rows arrives as an empty array rather than being omitted, so
 * the form tests one thing (`length`) rather than two.
 *
 * @mixin Tour
 */
class TourContentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'tour_id' => $this->id,

            /* The unnumbered lists. One table, told apart by kind. */
            'highlights' => $this->flatList('highlights'),
            'inclusions' => $this->flatList('inclusions'),
            'exclusions' => $this->flatList('exclusions'),

            'itinerary' => $this->whenLoaded('itineraryDays', fn () => $this->itineraryDays->map(fn ($day) => [
                'id' => $day->id,
                'day_number' => $day->day_number,
                'heading' => $day->heading,
                'title' => $day->title,
                'body' => $day->content,
                'stay' => $day->stay,
                'meals' => $day->meals,
                /* `Y-m-d`, never a timestamp: a date input handed an ISO
                   datetime is how a day lands a day early in one timezone. */
                'day_date' => $day->day_date?->format('Y-m-d'),
            ])->values()->all(), []),

            /* Three lists out of one table. Split here rather than in the form,
               because the grouping is a fact about the data. */
            'booking_steps' => $this->stepsOfKind(TourBookingStep::KIND_BOOKING),
            'documents' => $this->stepsOfKind(TourBookingStep::KIND_DOCUMENTS),
            'guidelines' => $this->stepsOfKind(TourBookingStep::KIND_GUIDELINES),
        ];
    }

    /**
     * One of the unnumbered lists: an id and the words.
     *
     * @return list<array<string, mixed>>
     */
    private function flatList(string $relation): array
    {
        if (!$this->relationLoaded($relation)) {
            return [];
        }

        return $this->{$relation}
            ->map(fn ($item) => [
                'id' => $item->id,
                'body' => $item->content,
            ])
            ->values()
            ->all();
    }

    /**
     * One of the numbered lists.
     *
     * The number is sent so the screen can show it, but it is not editable:
     * the save recomputes it from the row's position, because a number that
     * disagreed with the order would be a number the page prints wrong.
     *
     * @return list<array<string, mixed>>
     */
    private function stepsOfKind(string $kind): array
    {
        if (!$this->relationLoaded('bookingSteps')) {
            return [];
        }

        return $this->bookingSteps
            ->where('kind', $kind)
            ->map(fn ($step) => [
                'id' => $step->id,
                'number' => $step->step_number,
                'body' => $step->content,
            ])
            ->values()
            ->all();
    }
}
