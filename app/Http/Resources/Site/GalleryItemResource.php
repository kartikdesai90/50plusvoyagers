<?php

namespace App\Http\Resources\Site;

use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One photograph, as a visitor receives it.
 *
 * Deliberately smaller than the admin's view of the same record. Whether it is
 * switched off, where it sits in the order, which tour it is filed against and
 * when it was last edited are all facts about running the business — the server
 * has already acted on them by the time this is built.
 *
 * The alt text is resolved rather than sent raw, for the same reason the file
 * arrives as a URL: whether an editor wrote a description or the caption is
 * standing in for one is the application's business, and the markup only ever
 * needs something to announce.
 *
 * @mixin GalleryItem
 */
class GalleryItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            /* The place, over the picture. */
            'title' => $this->title,
            /* The line underneath it. */
            'caption' => $this->caption,

            'image_url' => $this->imageUrl(),
            /* The caption, or failing that the title. Derived rather than
               stored, so the picture and the words about it cannot disagree. */
            'image_alt' => $this->describedAs(),
        ];
    }
}
