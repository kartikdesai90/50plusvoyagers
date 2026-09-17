<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBlogPostRequest;
use App\Http\Requests\Admin\UpdateBlogPostRequest;
use App\Http\Resources\Admin\BlogPostResource;
use App\Models\BlogPost;
use App\Models\User;
use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * The journal.
 *
 * Two rules live here rather than in the screen, because both have to hold
 * however a post is written: an address is unique and never quietly changed
 * under an editor, and publishing records the moment it happened so that
 * "published" and "actually readable" can never drift apart.
 */
class BlogPostController extends Controller
{
    private const FOLDER = 'blog';

    /** How an editor is allowed to order the list. Anything else is ignored. */
    private const SORTABLE = [
        'published' => 'published_at',
        'newest' => 'created_at',
        'title' => 'title',
        'order' => 'display_order',
    ];

    public function __construct(private readonly FileStore $files) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $direction = $request->string('direction')->toString() === 'asc' ? 'asc' : 'desc';

        $posts = BlogPost::query()
            ->with('author')
            /*
             * `whereLike` rather than `where(..., 'like', ...)`: searching
             * for "Nagaland" and not finding "nagaland" would be a silent
             * change in what the panel does, so case-insensitivity is asked
             * for explicitly rather than left to the column's collation.
             */
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $query) => $query
                    ->whereLike('title', "%{$search}%")
                    ->orWhereLike('excerpt', "%{$search}%")
                    ->orWhereLike('slug', "%{$search}%"),
            ))
            ->when(
                $request->filled('status'),
                fn (Builder $query) => $query->where('status', $request->string('status')->toString()),
            )
            ->when(
                $request->filled('category'),
                fn (Builder $query) => $query->where('category', $request->string('category')->toString()),
            )
            ->when(
                $request->filled('featured'),
                fn (Builder $query) => $query->where('is_featured', $request->boolean('featured')),
            )
            // A date filter with one end open is still a useful filter, so each
            // half is applied on its own.
            ->when(
                $request->filled('from'),
                fn (Builder $query) => $query->whereDate('published_at', '>=', $request->string('from')->toString()),
            )
            ->when(
                $request->filled('to'),
                fn (Builder $query) => $query->whereDate('published_at', '<=', $request->string('to')->toString()),
            )
            ->orderBy(self::SORTABLE[$request->string('sort')->toString()] ?? 'created_at', $direction)
            ->orderBy('id', 'desc')
            ->paginate(20)
            ->withQueryString();

        return response()->json([
            'data' => BlogPostResource::collection($posts->items()),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'statuses' => array_map(fn (PostStatus $status) => [
                    'value' => $status->value,
                    'label' => $status->label(),
                    'description' => $status->description(),
                ], PostStatus::cases()),
                // Assembled from what has actually been used, so the list an
                // editor picks from is never a stale one somebody maintains.
                'categories' => BlogPost::query()
                    ->whereNotNull('category')
                    ->distinct()
                    ->orderBy('category')
                    ->pluck('category')
                    ->all(),
                'authors' => User::query()
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->map(fn (User $user) => ['id' => $user->id, 'name' => $user->name])
                    ->all(),
            ],
        ]);
    }

    public function show(BlogPost $blog): JsonResponse
    {
        return response()->json(['data' => new BlogPostResource($blog->load('author'))]);
    }

    public function store(StoreBlogPostRequest $request): JsonResponse
    {
        $post = new BlogPost($request->postAttributes());
        $post->slug = $this->addressFor($request->requestedSlug(), $post->title, null);

        $this->stampPublication($post);

        if ($request->hasFile('image_file')) {
            $post->image_path = $this->files->put($request->file('image_file'), self::FOLDER);
        }

        $post->save();

        return response()->json(
            ['data' => new BlogPostResource($post->load('author'))],
            Response::HTTP_CREATED,
        );
    }

    public function update(UpdateBlogPostRequest $request, BlogPost $blog): JsonResponse
    {
        $previous = $blog->image_path;
        $replacing = $request->hasFile('image_file');

        $blog->fill($request->postAttributes());
        $blog->slug = $this->addressFor($request->requestedSlug(), $blog->title, $blog->id);

        $this->stampPublication($blog);

        if ($replacing) {
            $blog->image_path = $this->files->put($request->file('image_file'), self::FOLDER);
        }

        $blog->save();

        if ($replacing) {
            $this->files->forget($previous);
        }

        return response()->json(['data' => new BlogPostResource($blog->refresh()->load('author'))]);
    }

    public function destroy(BlogPost $blog): JsonResponse
    {
        $path = $blog->image_path;

        $blog->delete();
        $this->files->forget($path);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Publishing with no moment recorded means now.
     *
     * A date an editor chose is left alone, which is how a post is set to
     * appear later.
     */
    private function stampPublication(BlogPost $post): void
    {
        if ($post->status === PostStatus::Published && $post->published_at === null) {
            $post->published_at = now();
        }
    }

    /**
     * The address to store: the one the editor typed, or one written from the
     * title and nudged until it is free.
     *
     * Only the generated branch needs the loop — an address an editor typed has
     * already been checked for a clash, and quietly changing it would be a
     * worse answer than the message they would otherwise have seen.
     */
    private function addressFor(?string $requested, string $title, ?int $ignoreId): string
    {
        if ($requested !== null) {
            return $requested;
        }

        $base = Str::slug($title) ?: 'post';
        $candidate = $base;
        $suffix = 1;

        while ($this->addressTaken($candidate, $ignoreId)) {
            $candidate = $base.'-'.(++$suffix);
        }

        return $candidate;
    }

    private function addressTaken(string $address, ?int $ignoreId): bool
    {
        return BlogPost::query()
            ->where('slug', $address)
            ->when($ignoreId !== null, fn (Builder $query) => $query->whereKeyNot($ignoreId))
            ->exists();
    }
}
