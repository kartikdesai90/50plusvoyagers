<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTourInOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * One day of a tour's itinerary.
 *
 * The date is the interesting field. The live pages hard-code one on every day
 * — thirteen of them on Spain-Portugal — so re-running the tour next year means
 * thirteen hand edits, and the Coorg page already shows what that costs.
 *
 * So `day_date` is normally null and the real date is worked out from the CRM's
 * departure date plus the day number. The column stays as an override for the
 * day that genuinely needs one.
 */
class TourItineraryDay extends Model
{
    use BelongsToTourInOrder;

    protected $fillable = [
        'tour_id',
        'day_number',
        'heading',
        'title',
        'content',
        'stay',
        'meals',
        'day_date',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'day_number' => 'integer',
            'day_date' => 'date',
            'display_order' => 'integer',
        ];
    }

    /**
     * Day order, which is what an itinerary means.
     *
     * Overrides the trait's `display_order`: on every other list an editor
     * decides the order, but day two cannot come after day three however the
     * rows were entered.
     *
     * @param  Builder<static>  $query
     */
    public function scopeInOrder(Builder $query): void
    {
        $query->orderBy('day_number')->orderBy('id');
    }

    /**
     * The date this day falls on.
     *
     * The editor's override where there is one, otherwise counted forward from
     * the departure. Null when the CRM has no departure date to count from —
     * the page then prints the day number alone, which is honest.
     */
    public function dateFrom(?\DateTimeInterface $departure): ?\DateTimeInterface
    {
        if ($this->day_date !== null) {
            return $this->day_date;
        }

        if ($departure === null) {
            return null;
        }

        return Carbon::instance($departure)
            ->addDays(max(0, $this->day_number - 1));
    }
}
