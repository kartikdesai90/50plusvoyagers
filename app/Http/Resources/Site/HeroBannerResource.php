<?php

namespace App\Http\Resources\Site;

use App\Models\HeroBanner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A homepage band as a visitor receives it.
 *
 * Deliberately smaller than the admin's view of the same record: whether a band
 * is switched off, where it sits in the order and when it was last edited are
 * facts about running the business, and none of them belong in a public
 * response. What is here is what the markup renders, and nothing else.
 *
 * @mixin HeroBanner
 */
class HeroBannerResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'media_url' => $this->mediaUrl(),
            /*
             * The band's own heading, which every band has. No description is
             * stored beside the picture: the heading is printed over it and
             * says the same thing, so a second field only invites the two to
             * drift apart.
             */
            'media_alt' => $this->heading,
            'label' => $this->label,
            'heading' => $this->heading,
            'description' => $this->description,
            'button' => $this->hasButton() ? [
                'text' => $this->button_text,
                'url' => $this->button_url,
            ] : null,

            /*
             * The words printed over the photograph, assembled the same way the
             * button is: null where an editor wrote none, so the markup asks
             * one question rather than four. Only the lead band's is ever
             * drawn, but which band leads is not this resource's business.
             */
            'caption' => $this->hasCaption() ? [
                'label' => $this->caption_label,
                'heading' => $this->caption_heading,
                'text' => $this->caption_text,
                'button' => $this->hasCaptionButton() ? [
                    'text' => $this->caption_button_text,
                    'url' => $this->caption_button_url,
                ] : null,
            ] : null,
        ];
    }
}
