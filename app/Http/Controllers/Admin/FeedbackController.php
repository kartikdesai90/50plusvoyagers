<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FeedbackType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFeedbackRequest;
use App\Http\Requests\Admin\UpdateFeedbackRequest;
use App\Http\Resources\Admin\FeedbackResource;
use App\Models\Feedback;
use App\Support\FileStore;
use App\Support\TourChoices;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * What travellers said about travelling with us.
 *
 * One module for both a written quote and a filmed one, because they are one
 * kind of record. Which fields matter follows the `type`, and that decision is
 * made in the request rules rather than here, so it holds however the record is
 * written.
 *
 * Filtering and searching are done by the database rather than in the browser:
 * unlike the handful of homepage bands, a testimonial list only grows, and
 * sending all of it so the screen can hide most of it would get slower every
 * month.
 */
class FeedbackController extends Controller
{
    private const FOLDER = 'feedback';

    /** How an editor is allowed to order the list. Anything else is ignored. */
    private const SORTABLE = [
        'order' => 'display_order',
        'newest' => 'created_at',
        'name' => 'customer_name',
        'rating' => 'rating',
    ];

    public function __construct(
        private readonly FileStore $files,
        private readonly TourChoices $tours,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $direction = $request->string('direction')->toString() === 'desc' ? 'desc' : 'asc';

        $feedback = Feedback::query()
            // Case-insensitive by request, not by luck: `whereLike` asks for
            // it outright rather than leaning on the column's collation.
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $query) => $query
                    ->whereLike('customer_name', "%{$search}%")
                    ->orWhereLike('customer_location', "%{$search}%")
                    ->orWhereLike('feedback_text', "%{$search}%"),
            ))
            ->when(
                $request->filled('type'),
                fn (Builder $query) => $query->where('type', $request->string('type')->toString()),
            )
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
            ->paginate(20)
            ->withQueryString();

        return response()->json([
            'data' => FeedbackResource::collection($feedback->items()),
            'meta' => [
                'current_page' => $feedback->currentPage(),
                'last_page' => $feedback->lastPage(),
                'per_page' => $feedback->perPage(),
                'total' => $feedback->total(),
                'types' => array_map(fn (FeedbackType $type) => [
                    'value' => $type->value,
                    'label' => $type->label(),
                    'description' => $type->description(),
                ], FeedbackType::cases()),
                'tours' => $this->tours->all(),
            ],
        ]);
    }

    public function show(Feedback $feedback): JsonResponse
    {
        return response()->json(['data' => new FeedbackResource($feedback)]);
    }

    public function store(StoreFeedbackRequest $request): JsonResponse
    {
        $feedback = new Feedback($request->feedbackAttributes());

        $this->attachFiles($request, $feedback);
        $feedback->save();

        return response()->json(
            ['data' => new FeedbackResource($feedback)],
            Response::HTTP_CREATED,
        );
    }

    /**
     * A new file replaces the old one, and the old one is then removed.
     *
     * Deleting after the save rather than before it: if the save fails, the
     * record still points at a file that exists, which is recoverable. The
     * other order leaves feedback pointing at nothing.
     */
    public function update(UpdateFeedbackRequest $request, Feedback $feedback): JsonResponse
    {
        $previous = [
            'video' => $feedback->video_path,
            'thumbnail' => $feedback->thumbnail_path,
            'photo' => $feedback->photo_path,
        ];

        $feedback->fill($request->feedbackAttributes());
        $replaced = $this->attachFiles($request, $feedback);

        // A written quote keeps no film, so anything it was carrying goes.
        if ($feedback->type === FeedbackType::Text && filled($feedback->video_path)) {
            $feedback->forceFill(['video_path' => null]);
            $replaced[] = 'video';
        }

        $feedback->save();

        foreach (array_unique($replaced) as $slot) {
            $this->files->forget($previous[$slot]);
        }

        return response()->json(['data' => new FeedbackResource($feedback->refresh())]);
    }

    public function destroy(Feedback $feedback): JsonResponse
    {
        $files = [
            $feedback->video_path,
            $feedback->thumbnail_path,
            $feedback->photo_path,
        ];

        $feedback->delete();

        foreach ($files as $path) {
            $this->files->forget($path);
        }

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Store whichever files this submission carried.
     *
     * @return array<int, string> the slots that were replaced
     */
    private function attachFiles(StoreFeedbackRequest|UpdateFeedbackRequest $request, Feedback $feedback): array
    {
        $replaced = [];

        if ($request->hasFile('video_file')) {
            $feedback->forceFill([
                'video_path' => $this->files->put($request->file('video_file'), self::FOLDER),
            ]);
            $replaced[] = 'video';
        }

        if ($request->hasFile('thumbnail_file')) {
            $feedback->forceFill([
                'thumbnail_path' => $this->files->put($request->file('thumbnail_file'), self::FOLDER),
            ]);
            $replaced[] = 'thumbnail';
        }

        if ($request->hasFile('photo_file')) {
            $feedback->forceFill([
                'photo_path' => $this->files->put($request->file('photo_file'), self::FOLDER),
            ]);
            $replaced[] = 'photo';
        }

        return $replaced;
    }
}
