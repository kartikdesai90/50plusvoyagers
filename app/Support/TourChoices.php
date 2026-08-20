<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The tours a record can be attached to.
 *
 * Empty until the Tours module exists. Every screen that offers a tour renders
 * its picker and its filter only when this list has something in it, so those
 * modules are complete on the day that table arrives and need no change beyond
 * this one query.
 *
 * Read through the query builder rather than a model on purpose: there is no
 * Tour model in this build, and adding an empty one to satisfy a picker would
 * be pretending the module exists.
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
            ->orderBy('title')
            ->get(['id', 'title'])
            ->map(fn ($tour) => ['id' => (int) $tour->id, 'name' => (string) $tour->title])
            ->all();
    }
}
