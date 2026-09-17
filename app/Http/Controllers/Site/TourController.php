<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\Site\TourCardResource;
use App\Http\Resources\Site\TourPageResource;
use App\Models\Tour;
use Illuminate\Http\JsonResponse;

/**
 * The public tour pages.
 *
 * One endpoint, for one page. There is no index here: the group tours listing
 * still runs on the front end's own catalogue, and it earns an endpoint on the
 * day its content moves — not before.
 *
 * Everything the page prints is loaded in one go. A tour page renders eight
 * lists, and eight lazy relations would be eight queries per page view; each
 * `with` below is one query for the whole page whatever the tour holds.
 */
class TourController extends Controller
{
    /**
     * Every published tour, as a card.
     *
     * One endpoint for three callers — the homepage's departure calendar, the
     * group tours listing, and the sitemap — because all three want the same
     * thing: which tours exist, and where each one lives. Three endpoints would
     * be three chances for them to disagree about what is published.
     *
     * The cover photograph is eager-loaded; the price and dates are read from
     * the CRM per tour inside the resource. That is one CRM query per card,
     * which is acceptable for a list this size and is the price of never
     * storing a copy of a price.
     */
    public function index(): JsonResponse
    {
        $tours = Tour::query()
            ->published()
            ->with('images')
            ->get();

        return response()->json([
            'data' => TourCardResource::collection($tours),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $tour = Tour::query()
            ->published()
            ->where('slug', $slug)
            ->with([
                /* Already ordered by the relation: cover first, then the
                   editor's order. `inOrder()` belongs to the tour's own list
                   tables and the gallery is not one of them. */
                'images',
                'highlights' => fn ($query) => $query->inOrder(),
                'itineraryDays' => fn ($query) => $query->inOrder(),
                'inclusions' => fn ($query) => $query->inOrder(),
                'exclusions' => fn ($query) => $query->inOrder(),
                'bookingSteps' => fn ($query) => $query->orderBy('kind')->orderBy('step_number'),

                /*
                 * The Feedback module's own rules, not a second opinion on
                 * them: only what an editor approved, in the order they chose.
                 */
                'testimonials' => fn ($query) => $query
                    ->where('is_active', true)
                    ->orderByDesc('is_featured')
                    ->orderBy('display_order')
                    ->orderBy('id'),
            ])
            ->first();

        if ($tour === null) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json(['data' => new TourPageResource($tour)]);
    }
}
