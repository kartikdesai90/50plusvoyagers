<?php

namespace App\Http\Resources\Admin;

use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One tour as its editor sees it.
 *
 * The CRM's five fields and nothing beside them. `end_date` goes out as a plain
 * `Y-m-d` string rather than a timestamp: it is a calendar date, and handing a
 * date input an ISO datetime is how a tour ends up a day early in one timezone.
 *
 * @mixin Tour
 */
class TourResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tour_code' => $this->tour_code,
            'tour_name' => $this->tour_name,
            'end_date' => $this->end_date?->format('Y-m-d'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
