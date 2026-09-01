<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTourRequest;
use App\Http\Requests\Admin\UpdateTourRequest;
use App\Http\Resources\Admin\TourResource;
use App\Models\Tour;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The group tours.
 *
 * Five endpoints rather than the two the homepage bands use, because this is a
 * list an editor browses and adds to over time — not a fixed set saved whole.
 *
 * There are no files here and so no cleanup after a delete: a tour is five
 * fields of text and a date. When the display columns arrive — a photograph
 * among them — this grows the same `FileStore` handling the other modules use.
 */
class TourController extends Controller
{
    /** How an editor is allowed to order the list. Anything else is ignored. */
    private const SORTABLE = [
        'ending' => 'end_date',
        'name' => 'tour_name',
        'code' => 'tour_code',
        'newest' => 'created_at',
    ];

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';

        $tours = Tour::query()
            /*
             * `whereLike` rather than `where(..., 'like', ...)`: PostgreSQL's
             * LIKE is case sensitive where MySQL's, under a `_ci` collation,
             * was not. Searching for "Coorg" and not finding "coorg" would be a
             * silent change in what the panel does.
             */
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $query) => $query
                    ->whereLike('tour_name', "%{$search}%")
                    ->orWhereLike('tour_code', "%{$search}%"),
            ))
            /*
             * The default is the model's own order rather than a column, so
             * "soonest" means one thing everywhere and undated tours do not
             * float to the top. An explicit sort overrides it.
             */
            ->when(
                isset(self::SORTABLE[$sort]),
                fn (Builder $query) => $query
                    ->orderBy(self::SORTABLE[$sort], $direction)
                    ->orderBy('id'),
                fn (Builder $query) => $query->soonest(),
            )
            ->paginate(20)
            ->withQueryString();

        return response()->json([
            'data' => TourResource::collection($tours->items()),
            'meta' => [
                'current_page' => $tours->currentPage(),
                'last_page' => $tours->lastPage(),
                'per_page' => $tours->perPage(),
                'total' => $tours->total(),
            ],
        ]);
    }

    public function show(Tour $tour): JsonResponse
    {
        return response()->json(['data' => new TourResource($tour)]);
    }

    public function store(StoreTourRequest $request): JsonResponse
    {
        $tour = Tour::create($request->tourAttributes());

        return response()->json(
            ['data' => new TourResource($tour)],
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateTourRequest $request, Tour $tour): JsonResponse
    {
        $tour->fill($request->tourAttributes())->save();

        return response()->json(['data' => new TourResource($tour->refresh())]);
    }

    public function destroy(Tour $tour): JsonResponse
    {
        $tour->delete();

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
