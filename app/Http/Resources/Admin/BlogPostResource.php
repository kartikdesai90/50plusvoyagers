<?php

namespace App\Http\Resources\Admin;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One journal post as its editor sees it.
 *
 * The disk and the stored path never leave the server. Reading time and whether
 * the post is actually live are computed here rather than in the browser, so
 * the list, the form and the public site cannot disagree about either.
 *
 * @mixin BlogPost
 */
class BlogPostResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,

            'image_url' => $this->imageUrl(),

            'category' => $this->category,
            'tags' => $this->tags ?? [],
            'author_id' => $this->author_id,
            /* The staff member's name, for the list's "filed by" column. */
            'staff_name' => $this->whenLoaded('author', fn () => $this->author?->name),
            /* The credit an editor typed, and the byline a reader will see. */
            'author_name' => $this->author_name,
            'byline' => $this->bylineName(),

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'canonical_url' => $this->canonical_url,

            'is_featured' => $this->is_featured,
            'status' => $this->status->value,
            'status_label' => $this->statusLabel(),
            'is_live' => $this->isLive(),
            'published_at' => $this->published_at?->toIso8601String(),
            'display_order' => $this->display_order,

            'reading_minutes' => $this->readingMinutes(),
            'public_path' => $this->publicPath(),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /** Already phrased for a person; the screen renders it as it arrives. */
    private function statusLabel(): string
    {
        if ($this->status->value !== 'published') {
            return $this->status->label();
        }

        return $this->isLive() ? 'Published' : 'Scheduled';
    }
}
