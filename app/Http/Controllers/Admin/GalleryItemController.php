<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreGalleryItemRequest;
use App\Http\Requests\Admin\UpdateGalleryItemRequest;
use App\Http\Resources\Admin\GalleryItemResource;
use App\Models\GalleryItem;
use App\Support\FileStore;
use App\Support\TourChoices;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Photographs from the road.
 *
 * Pictures only. A film belongs to the band it plays behind or to the traveller
 * who recorded it, and both already have a home — a gallery that accepted one
 * would be a third place to look.
 */
class GalleryItemController extends Controller
{
    private const FOLDER = 'gallery';

    /** How an editor is allowed to order the list. Anything else is ignored. */
    private const SORTABLE = [
        'order' => 'display_order',
        'newest' => 'created_at',
        'title' => 'title',
    ];

    public function __construct(
        private readonly FileStore $files,
        private readonly TourChoices $tours,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';

        $items = GalleryItem::query()
            // Case-insensitive by request, not by luck: `whereLike` asks for
            // it outright rather than leaning on the column's collation.
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $query) => $query
                    ->whereLike('title', "%{$search}%")
                    ->orWhereLike('caption', "%{$search}%"),
            ))
            ->when(
                $request->filled('status'),
                fn (Builder $query) => $query->where('is_active', $request->string('status')->toString() === 'active'),
            )
            ->when(
                $request->filled('featured'),
                fn (Builder $query) => $query->where('is_featured', $request->boolean('featured')),
            )
            ->when(
                $request->filled('tour_id'),
                fn (Builder $query) => $query->where('tour_id', (int) $request->query('tour_id')),
            )
            ->orderBy(self::SORTABLE[$request->string('sort')->toString()] ?? 'display_order', $direction)
            ->orderBy('id')
            ->paginate(24)
            ->withQueryString();

        return response()->json([
            'data' => GalleryItemResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'tours' => $this->tours->all(),
            ],
        ]);
    }

    public function show(GalleryItem $gallery): JsonResponse
    {
        return response()->json(['data' => new GalleryItemResource($gallery)]);
    }

    public function store(StoreGalleryItemRequest $request): JsonResponse
    {
        $item = new GalleryItem($request->galleryAttributes());

        $item->image_path = $this->files->put($request->file('image_file'), self::FOLDER);
        $item->save();

        return response()->json(
            ['data' => new GalleryItemResource($item)],
            Response::HTTP_CREATED,
        );
    }

    /**
     * A new picture replaces the old one, and the old one is then removed.
     *
     * Deleting after the save rather than before it: if the save fails, the
     * record still points at a file that exists, which is recoverable. The
     * other order leaves a gallery entry pointing at nothing.
     */
    public function update(UpdateGalleryItemRequest $request, GalleryItem $gallery): JsonResponse
    {
        $previous = $gallery->image_path;
        $replacing = $request->hasFile('image_file');

        $gallery->fill($request->galleryAttributes());

        if ($replacing) {
            $gallery->image_path = $this->files->put($request->file('image_file'), self::FOLDER);
        }

        $gallery->save();

        if ($replacing) {
            $this->files->forget($previous);
        }

        return response()->json(['data' => new GalleryItemResource($gallery->refresh())]);
    }

    public function destroy(GalleryItem $gallery): JsonResponse
    {
        $path = $gallery->image_path;

        $gallery->delete();
        $this->files->forget($path);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
