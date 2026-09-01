<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The tours a record can be attached to.
 *
 * Every screen that offers a tour renders its picker and its filter only when
 * this list has something in it, so a fresh install with no tours yet shows no
 * empty control.
 *
 * Named from `tour_name`, which is what the client's CRM calls the column. The
 * table check stays: the modules that call this must keep working against a
 * database where the migration has not run yet.
 *
 * Read through the query builder rather than the model on purpose. This is a
 * picker — two columns of a row — and going through Eloquent would hydrate
 * whole models to throw all but the name away.
 */
class TourChoices
{
    /** @return array<int, array{id: int, name: string}> */
    public function all(): array
    {
        if (!Schema::hasTable('tours')) {
            return [];
        }

        return DB::table('tours')
            ->when(
                Schema::hasColumn('tours', 'deleted_at'),
                fn ($query) => $query->whereNull('deleted_at'),
            )
            ->orderBy('tour_name')
            ->get(['id', 'tour_name'])
            ->map(fn ($tour) => ['id' => (int) $tour->id, 'name' => (string) $tour->tour_name])
            ->all();
    }
}
