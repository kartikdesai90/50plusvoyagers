<?php

namespace App\Http\Resources\Site;

use App\Models\WhyUsSection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The "Why travel with us" band as a visitor receives it.
 *
 * Deliberately smaller than the admin's view of the same row: when it was last
 * edited is a fact about running the business, not something the markup draws.
 *
 * The band's title and the line over it are not here and never were — they are
 * written into the front end, beside the layout they title.
 *
 * The button and the caption are assembled rather than sent as loose fields, so
 * the markup asks one question instead of two or four — the same shape a band
 * arrives in, for the same reason.
 *
 * @mixin WhyUsSection
 */
class WhyUsSectionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            /* Already stripped of the rows an editor left blank. */
            'points' => $this->pointList(),
            'button' => $this->hasButton() ? [
                'text' => $this->button_text,
                'url' => $this->button_url,
            ] : null,

            /*
             * Empty `alt`, which is how a decorative image is declared. This
             * band has no heading of its own — the design's words title it from
             * the front end — so there is nothing here to name the picture
             * with, and a screen reader is better served by silence than by a
             * filename read aloud.
             */
            'image' => [
                'url' => $this->imageUrl(),
                'alt' => '',
            ],

            'caption' => $this->hasCaption() ? [
                'heading' => $this->caption_heading,
                'text' => $this->caption_text,
            ] : null,
        ];
    }
}
