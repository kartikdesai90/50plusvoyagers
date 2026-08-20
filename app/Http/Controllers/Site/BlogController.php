<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\Site\BlogPostCardResource;
use App\Http\Resources\Site\BlogPostResource;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * The journal, as readers receive it.
 *
 * Two answers, because the index and an article are two different questions.
 * The index needs every published post without any of their prose; an article
 * needs one post and all of it. Serving both from one endpoint would mean
 * sending fifteen articles to render a list of fifteen titles.
 *
 * Everything here goes through the model's `published` scope, which is where
 * "live" is defined — published *and* the moment has passed. A draft or a post
 * scheduled for next week is not findable from either endpoint, including by
 * anyone who knows its address.
 */
class BlogController extends Controller
{
    /**
     * Every published post, in reading order.
     *
     * Unpaginated on purpose. This is a club journal of a few dozen articles
     * that the index filters in the browser, and paginating a list that short
     * would cost a round trip every time a reader pressed a category.
     */
    public function index(): JsonResponse
    {
        $posts = BlogPost::query()
            ->published()
            ->inReadingOrder()
            ->with('author:id,name')
            ->get();

        return response()->json([
            'posts' => BlogPostCardResource::collection($posts)->resolve(),

            /*
             * The filter buttons, assembled from what has actually been filed
             * rather than from a maintained list — the same rule the admin's
             * category field follows. A category nothing is filed under is a
             * button that can only ever show an empty page.
             */
            'categories' => $posts
                ->pluck('category')
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->all(),
        ]);
    }

    /** One post, in full. */
    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::query()
            ->published()
            ->with('author:id,name')
            ->where('slug', $slug)
            ->first();

        if ($post === null) {
            throw new NotFoundHttpException('No published post lives at that address.');
        }

        /*
         * What to read next. The same category first, because a reader who
         * finished a travelogue is most likely to want another one, and
         * anything else after it rather than nothing — three cards is part of
         * the design, and a journal with two travelogues in it should not leave
         * one of them showing a single card.
         */
        $others = BlogPost::query()
            ->published()
            ->whereKeyNot($post->getKey())
            ->inReadingOrder()
            ->with('author:id,name')
            ->get()
            /* Sorted here rather than in SQL: PHP's sort has been stable since
               8.0, so reading order survives inside each of the two groups, and
               the expression stays the same on every database. */
            ->sortBy(fn (BlogPost $other) => $other->category === $post->category ? 0 : 1)
            ->take(3)
            ->values();

        return response()->json([
            'post' => (new BlogPostResource($post))->resolve(),
            'related' => BlogPostCardResource::collection($others)->resolve(),
        ]);
    }
}
