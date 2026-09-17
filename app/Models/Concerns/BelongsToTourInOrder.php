<?php

namespace App\Models\Concerns;

use App\Models\Tour;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A list that belongs to a tour and has an order.
 *
 * Four of the tour's child tables are the same two facts — whose list this is,
 * and where the row sits in it — differing only in what they carry. Written
 * once here rather than four times, so "in order" cannot come to mean two
 * different things on two of them.
 */
trait BelongsToTourInOrder
{
    /** @return BelongsTo<Tour, $this> */
    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    /**
     * The editor's order, with the id breaking ties.
     *
     * Without the tiebreak, two rows an editor never reordered come back in
     * whatever order the database finds them, which is not stable between
     * requests — the page would quietly reshuffle itself.
     *
     * @param  Builder<static>  $query
     */
    public function scopeInOrder(Builder $query): void
    {
        $query->orderBy('display_order')->orderBy('id');
    }
}
