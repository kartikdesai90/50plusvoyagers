<?php

namespace App\Http\Resources\Admin;

use App\Models\WhyUsSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The "Why travel with us" band as its editor sees it.
 *
 * Flat where the site's view of the same row is assembled: a form edits fields,
 * so it receives fields. The disk and the stored path never leave the server —
 * an editor works with a picture they can see, and where the bytes live is the
 * application's business.
 *
 * @mixin WhyUsSection
 */
class WhyUsSectionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            /* The written rows as they were written, blanks included: this is
               what the editor left in the boxes, not what the site draws. */
            'points' => array_values($this->points ?? []),

            'button_text' => $this->button_text,
            'button_url' => $this->button_url,

            'image_url' => $this->imageUrl(),

            'caption_heading' => $this->caption_heading,
            'caption_text' => $this->caption_text,

            /* Null on a site where this band has never been filled in — the
               record is real but has never been saved, and the screen says so. */
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
