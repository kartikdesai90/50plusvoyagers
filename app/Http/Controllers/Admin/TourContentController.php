<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TourContentRequest;
use App\Http\Resources\Admin\TourContentResource;
use App\Models\Tour;
use App\Models\TourItineraryDay;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * The repeating blocks of one tour page — the day-by-day, the highlights, what
 * the price covers and what it does not.
 *
 * A module of its own rather than more fields on {@see TourController}, for two
 * reasons that both come down to not losing an editor's work.
 *
 * The first is that `TourRequest::tourAttributes()` deliberately writes only
 * the keys that arrived, so a screen editing the CRM fields cannot blank the
 * page fields it never showed. Folding seven lists into that same save would
 * break the rule the moment a screen showed some lists and not others — the
 * unsent ones would read as "empty", and emptying a list is how you delete it.
 *
 * The second is that this is a different sitting. Correcting a tour code takes
 * a moment; writing thirteen days does not. They save separately because they
 * are finished separately.
 *
 * Two endpoints, not five, though these are rows rather than a single record:
 * the lists are read as a group and written as a group. What arrives is what
 * the page becomes, and a row left out of the payload is a row taken off the
 * page — the same contract {@see WhoWeAreCardController} uses for the homepage
 * cards.
 */
class TourContentController extends Controller
{
    public function show(Tour $tour): JsonResponse
    {
        return response()->json(['data' => new TourContentResource($this->loaded($tour))]);
    }

    /**
     * Save the set.
     *
     * In a transaction because this is one change to one page made out of many
     * writes. An editor who reordered the itinerary and removed a day must not
     * be able to end up with half of that — least of all on a page a visitor is
     * reading while it happens.
     *
     * The three kinds sharing `tour_list_items`, and the three sharing
     * `tour_booking_steps`, are each synced against only their own kind. That
     * is what stops saving the inclusions from deleting the exclusions: both
     * are rows of the same table with the same `tour_id`, and a sync that
     * looked at the table rather than the list would take the other one with it.
     */
    public function update(TourContentRequest $request, Tour $tour): JsonResponse
    {
        DB::transaction(function () use ($request, $tour) {
            foreach (array_keys(TourContentRequest::FLAT_LISTS) as $list) {
                $this->sync(
                    /* The relation already filters to this list's kind, which
                       is what scopes the delete below to the right third of a
                       shared table. */
                    $tour->{$this->relationFor($list)}()->where(
                        'kind',
                        TourContentRequest::FLAT_LISTS[$list]['kind'],
                    )->get(),
                    $request->listRows($list),
                    $tour,
                    TourContentRequest::FLAT_LISTS[$list]['model'],
                );
            }

            $this->syncItinerary($tour, $request->itineraryRows());
        });

        return response()->json(['data' => new TourContentResource($this->loaded($tour->refresh()))]);
    }

    /**
     * Which relation on the tour holds a given list.
     *
     * The three numbered lists all live on `bookingSteps`; the unnumbered ones
     * have a relation each.
     */
    private function relationFor(string $list): string
    {
        return match ($list) {
            'highlights', 'inclusions', 'exclusions' => $list,
            default => 'bookingSteps',
        };
    }

    /**
     * Make the stored rows match what arrived.
     *
     * A row that came with an id is updated, a row without one is created, and
     * a stored row nothing claimed is deleted. The id is looked up among *this
     * tour's* rows rather than globally — a payload naming another tour's row
     * must not be able to move it here, and validating `exists` alone would not
     * have stopped that.
     *
     * @param  Collection<int, Model>  $stored
     * @param  list<array{id: ?int, attributes: array<string, mixed>}>  $rows
     * @param  class-string<Model>  $model
     */
    private function sync(Collection $stored, array $rows, Tour $tour, string $model): void
    {
        $byId = $stored->keyBy('id');
        $kept = [];

        foreach ($rows as $row) {
            $existing = $row['id'] !== null ? $byId->get($row['id']) : null;

            $record = $existing ?? new $model(['tour_id' => $tour->id]);

            $record->fill($row['attributes']);
            $record->tour_id = $tour->id;
            $record->save();

            $kept[] = $record->id;
        }

        foreach ($stored as $row) {
            if (!in_array($row->id, $kept, true)) {
                $row->delete();
            }
        }
    }

    /**
     * Where day numbers are parked while an itinerary is being reordered.
     *
     * Above `MAX_ROWS` and far below the 65535 an `unsignedSmallInteger` holds,
     * so a parked number can never collide with a real one still to be
     * assigned, and never overflows the column.
     */
    private const PARKED_FROM = 30000;

    /**
     * The day-by-day, which needs one extra step the flat lists do not.
     *
     * `tour_itinerary_days` has a unique index on `(tour_id, day_number)`, and
     * the numbers are recomputed from row order on every save. So an editor who
     * moves day three above day two would, mid-loop, briefly have two rows
     * claiming day two, and the database would refuse the save.
     *
     * The stored numbers are therefore parked out of the range real days use
     * before any of them are rewritten. Parking upward rather than to a
     * negative: `day_number` is unsigned, so a negative would be rejected by
     * the column itself on both MySQL and SQLite.
     *
     * One statement per row rather than one for the table, because the parked
     * value has to stay unique — the index is still being enforced while they
     * sit there.
     *
     * @param  list<array{id: ?int, attributes: array<string, mixed>}>  $days
     */
    private function syncItinerary(Tour $tour, array $days): void
    {
        $stored = $tour->itineraryDays()->get();

        foreach ($stored->values() as $offset => $day) {
            $parked = self::PARKED_FROM + $offset;

            $tour->itineraryDays()
                ->whereKey($day->getKey())
                ->update(['day_number' => $parked]);

            /*
             * The model has to be told, not just the table.
             *
             * Parking with the query builder leaves the instance in `$stored`
             * holding the number it had before. `sync()` then fills each row
             * with its new number and saves — and Eloquent writes nothing for a
             * row whose new number equals the stale one it still thinks it has.
             * A day that kept its number while its neighbours moved would be
             * left stranded at its parked value, which is how an itinerary ends
             * up with a day numbered 30001.
             */
            $day->setAttribute('day_number', $parked)->syncOriginalAttribute('day_number');
        }

        $this->sync($stored, $days, $tour, TourItineraryDay::class);
    }

    /** The tour with every list it owns, each in its own order. */
    private function loaded(Tour $tour): Tour
    {
        return $tour->load([
            'highlights' => fn ($query) => $query->inOrder(),
            'inclusions' => fn ($query) => $query->inOrder(),
            'exclusions' => fn ($query) => $query->inOrder(),
            'itineraryDays' => fn ($query) => $query->inOrder(),
            'bookingSteps' => fn ($query) => $query->orderBy('kind')->orderBy('step_number'),
        ]);
    }
}
