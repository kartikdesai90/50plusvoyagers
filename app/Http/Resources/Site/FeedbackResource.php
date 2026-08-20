<?php

namespace App\Http\Resources\Site;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * What one traveller said, as a visitor receives it.
 *
 * Deliberately smaller than the admin's view of the same record. Whether a quote
 * is switched off, where it sits in the order, which tour it is filed against
 * and when it was last edited are all facts about running the business — the
 * server has already acted on them by the time this is built, and none of them
 * belong in a public response.
 *
 * `video_source` is the resolved address rather than the two columns behind it,
 * for the same reason the band resource sends `media_url`: whether a film was
 * uploaded or linked is the application's business, and the markup only ever
 * needs somewhere to point.
 *
 * @mixin Feedback
 */
class FeedbackResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,

            'name' => $this->customer_name,
            /* The trip and year on a written quote; the role on a filmed one. */
            'context' => $this->customer_location,
            'quote' => $this->feedback_text,

            'video_source' => $this->videoSource(),
            /*
             * No description travels with either picture. Both are portraits of
             * the traveller `name` already carries, and the markup builds the
             * `alt` from that rather than from a second field saying the same.
             */
            'thumbnail_url' => $this->thumbnailUrl(),
            'photo_url' => $this->photoUrl(),

            /*
             * Kept, unlike the other editorial flags: the films row renders its
             * featured card taller, so this one is a fact about the layout and
             * not only about administration.
             */
            'is_featured' => $this->is_featured,
        ];
    }
}
