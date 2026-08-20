<?php

namespace App\Http\Resources\Site;

use App\Models\WhoWeAreCard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One "Who we are" card as a visitor receives it.
 *
 * Note what is absent: whether the card is switched off, and where it sits in
 * the order. Both are decisions the server has already applied — a card that
 * arrives here is one that is meant to be on the page, in the position it
 * arrived in.
 *
 * @mixin WhoWeAreCard
 */
class WhoWeAreCardResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'image_url' => $this->imageUrl(),
            /* The card's own title. Derived rather than stored, so it is
               never empty and never disagrees with the words beside it. */
            'image_alt' => $this->describedAs(),
        ];
    }
}
