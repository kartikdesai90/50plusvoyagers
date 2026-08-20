<?php

namespace App\Http\Resources\Admin;

use App\Models\HeroBanner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A homepage band as its editor sees it.
 *
 * The disk and the stored path never leave the server — an editor works with a
 * file they can see, and where the bytes live is the application's business.
 * Exposing the path would invite something to start building its own addresses.
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
            'section_type' => $this->section_type->value,
            'section_label' => $this->section_type->label(),
            'media_url' => $this->mediaUrl(),
            'label' => $this->label,
            'heading' => $this->heading,
            'description' => $this->description,
            'button_text' => $this->button_text,
            'button_url' => $this->button_url,
            'caption_label' => $this->caption_label,
            'caption_heading' => $this->caption_heading,
            'caption_text' => $this->caption_text,
            'caption_button_text' => $this->caption_button_text,
            'caption_button_url' => $this->caption_button_url,
            'is_active' => $this->is_active,
            'display_order' => $this->display_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
