<?php

namespace App\Http\Resources\Admin;

use App\Models\WhoWeAreCard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One "Who we are" card as its editor sees it.
 *
 * Carries the two things a visitor's copy deliberately does not: whether the
 * card is switched on, and where it sits. The screen that edits the four of
 * them together is the one place those are decided.
 *
 * The disk and the stored path never leave the server — an editor works with a
 * picture they can see.
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
            'is_active' => $this->is_active,
            'display_order' => $this->display_order,
        ];
    }
}
