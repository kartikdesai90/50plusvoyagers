<?php

namespace App\Http\Resources\Site;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One journal post as a card — the listing's view of it, and the homepage's.
 *
 * The body is the one thing deliberately absent. A listing renders fifteen of
 * these and shows the excerpt of each; sending fifteen full articles so that
 * fifteen excerpts can be printed would be most of a journal's worth of prose
 * down the wire to render none of it.
 *
 * The date, the reading time and the byline arrive already phrased. All three
 * are decisions — how a date reads, what to do when nobody is credited — and a
 * decision made in the resource is one the homepage, the index and the article
 * itself cannot make differently from each other.
 *
 * @mixin BlogPost
 */
class BlogPostCardResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'excerpt' => $this->excerpt ?? '',

            'category' => $this->category,
            'author' => $this->bylineName(),
            /* Already a date a person reads: "12 Dec 2025". */
            'date' => $this->publishedOn(),
            /* Already a phrase: "7 min read". */
            'reading_time' => $this->readingTime(),

            'image_url' => $this->imageUrl(),
            /* The post's own title. Derived rather than stored, so the picture
               and the headline over it cannot disagree. */
            'image_alt' => $this->title,

            /*
             * Kept, unlike the other editorial flags: the journal index gives
             * its lead article the full-width treatment, so this one is a fact
             * about the layout and not only about administration.
             */
            'is_featured' => $this->is_featured,
        ];
    }
}
