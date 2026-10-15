<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTourRequest;
use App\Http\Requests\Admin\UpdateTourRequest;
use App\Http\Resources\Admin\TourResource;
use App\Models\Tour;
use App\Support\FileStore;
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
 * The pictures a tour owns outright — its main image, its route map and its
 * share image — are handled here with the same `FileStore` the other modules
 * use: replaced on save, and deleted only once the save has held. The carousel
 * is not among them; those are `gallery_items` with a life of their own.
 */
class TourController extends Controller
{
    /** How an editor is allowed to order the list. Anything else is ignored. */
    private const SORTABLE = [
        'name' => 'tour_name',
        'code' => 'tour_code',
        'newest' => 'created_at',
    ];

    /**
     * The three pictures a tour itself carries: request field to the column it
     * is stored in, and the folder it lives in.
     *
     * The carousel is not here — those are `gallery_items` filed against the
     * tour and managed with their own rows. The main image is, because it is
     * the tour's own: a lead picture is not necessarily one of the carousel's,
     * and inferring it from a cover flag left an editor no way to set it.
     */
    private const PICTURES = [
        'route_map_file' => ['route_map_path', 'tours/maps'],
        'og_image_file' => ['og_image_path', 'tours/og'],
        'image_file' => ['image_path', 'tours/main'],
    ];

    public function __construct(private readonly FileStore $files) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';

        $tours = Tour::query()
            /*
             * So the list can show which tours have a written page and which
             * are still only CRM records. Five aggregates in the one query
             * rather than five queries per row.
             */
            ->withCount(['images', 'highlights', 'itineraryDays', 'inclusions', 'exclusions'])
            /*
             * `whereLike` rather than `where(..., 'like', ...)`: searching
             * for "Coorg" and not finding "coorg" would be a silent change in
             * what the panel does, so case-insensitivity is asked for outright
             * rather than left to the column's collation.
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
        $tour = new Tour($request->tourAttributes());

        foreach (self::PICTURES as $field => [$pathColumn, $folder]) {
            if ($request->hasFile($field)) {
                $tour->{$pathColumn} = $this->files->put($request->file($field), $folder);
            }
        }

        $tour->save();

        return response()->json(
            ['data' => new TourResource($tour)],
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateTourRequest $request, Tour $tour): JsonResponse
    {
        /** @var list<?string> $discard */
        $discard = [];

        $tour->fill($request->tourAttributes());

        foreach (self::PICTURES as $field => [$pathColumn, $folder]) {
            if (!$request->hasFile($field)) {
                continue;
            }

            /* The one being replaced, deleted only once the save has held. */
            $discard[] = $tour->{$pathColumn};

            $tour->{$pathColumn} = $this->files->put($request->file($field), $folder);
        }

        $tour->save();

        foreach ($discard as $path) {
            $this->files->forget($path);
        }

        return response()->json(['data' => new TourResource($tour->refresh())]);
    }

    /**
     * Removing a tour removes its page with it.
     *
     * The lists go by cascade, which the database does. The three files the
     * tour itself owns — its main image, its route map and its share image —
     * do not, so they are collected first and deleted after.
     *
     * The carousel is deliberately not touched. Those are `gallery_items`: they
     * are photographs in their own right, they appear on the public wall, and
     * more than one tour may have been filed against the same picture. Deleting
     * the file here would blank a gallery a visitor is still looking at. The
     * rows are released from the tour instead, which leaves the photographs
     * where they were and the gallery intact.
     */
    public function destroy(Tour $tour): JsonResponse
    {
        $files = [
            $tour->route_map_path,
            $tour->og_image_path,
            $tour->image_path,
        ];

        $tour->images()->update(['tour_id' => null, 'is_cover' => false]);

        $tour->delete();

        foreach ($files as $path) {
            $this->files->forget($path);
        }

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
