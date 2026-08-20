<?php

namespace App\Http\Resources\Admin;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One piece of feedback as its editor sees it.
 *
 * Disks and stored paths never leave the server — an editor works with a file
 * they can see, and where the bytes live is the application's business. What
 * does leave is whether a film was uploaded or linked, because that is a thing
 * an editor decided and may want to change.
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
            'type_label' => $this->type->label(),

            'customer_name' => $this->customer_name,
            'customer_location' => $this->customer_location,
            'feedback_text' => $this->feedback_text,

            'video_url' => $this->video_url,
            'video_source' => $this->videoSource(),
            'video_is_uploaded' => filled($this->video_path),

            'thumbnail_url' => $this->thumbnailUrl(),
            'photo_url' => $this->photoUrl(),

            'tour_id' => $this->tour_id,

            'is_featured' => $this->is_featured,
            'is_active' => $this->is_active,
            'display_order' => $this->display_order,

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
