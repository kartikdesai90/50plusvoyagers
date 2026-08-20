<?php

namespace App\Http\Resources\Admin;

use App\Models\GalleryItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One photograph as its editor sees it.
 *
 * The disk and the stored path never leave the server — an editor works with a
 * picture they can see, and where the bytes live is the application's business.
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
            'title' => $this->title,
            'caption' => $this->caption,
            'image_url' => $this->imageUrl(),
            'described_as' => $this->describedAs(),
            'tour_id' => $this->tour_id,
            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'display_order' => $this->display_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
