<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One group tour, as the client's CRM describes it.
 *
 * Five fields, matching the CRM's own `tours` table. The display fields a tour
 * card needs — price, departure date, duration, photograph — are not here yet
 * and are not invented here: they belong to the CRM's shape and arrive when it
 * is extended.
 *
 * So this model is deliberately thin. It carries the two rules that would
 * otherwise be rewritten by every caller: how a tour is identified, and the
 * order a list of them comes back in.
 */
class Tour extends Model
{
    protected $fillable = [
        'tour_code',
        'tour_name',
        'end_date',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'end_date' => 'date',
        ];
    }

    /**
     * The order a list of tours is read in.
     *
     * Soonest-ending first, because that is the one an editor is most likely to
     * be looking for. A tour with no end date sorts last rather than first:
     * PostgreSQL puts nulls first on an ascending sort, which would otherwise
     * float every undated row to the top of the screen.
     *
     * @param  Builder<static>  $query
     */
    public function scopeSoonest(Builder $query): void
    {
        $query->orderByRaw('end_date IS NULL')
            ->orderBy('end_date')
            ->orderBy('id');
    }

    /**
     * What an editor sees when a tour has to name itself in one line.
     *
     * The CRM's own name for it. Falls back to the code, because a row can
     * exist before anyone has written a readable name for it and a blank entry
     * in a picker is worse than a terse one.
     */
    public function describedAs(): string
    {
        return $this->tour_name !== '' && $this->tour_name !== null
            ? (string) $this->tour_name
            : (string) $this->tour_code;
    }
}
