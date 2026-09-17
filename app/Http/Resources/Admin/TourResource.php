<?php

namespace App\Http\Resources\Admin;

use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One tour as its editor sees it.
 *
 * The CRM's five fields, the page's own, and a count of what each of its
 * content lists holds — so the list screen can show at a glance which tours
 * have been written and which are still only CRM records.
 *
 * `end_date` goes out as a plain `Y-m-d` string rather than a timestamp: it is
 * a calendar date, and handing a date input an ISO datetime is how a tour ends
 * up a day early in one timezone.
 *
 * The disks and stored paths never leave the server — an editor works with a
 * picture they can see.
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

            /* The CRM's five. */
            'tour_code' => $this->tour_code,
            'tour_name' => $this->tour_name,
            'end_date' => $this->end_date?->format('Y-m-d'),

            /* The page. */
            'slug' => $this->slug,
            'legacy_url' => $this->legacy_url,
            'page_title' => $this->page_title,
            'subtitle' => $this->subtitle,
            'region' => $this->region,
            'summary' => $this->summary,
            'ribbon_text' => $this->ribbon_text,
            'image_url' => $this->imageUrl(),
            'route_map_url' => $this->routeMapUrl(),
            'visa_content' => $this->visa_content,
            'booking_fee' => $this->booking_fee,
            'balance_due_days' => $this->balance_due_days,

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image_url' => $this->ogImageUrl(),
            'canonical_url' => $this->canonical_url,

            'status' => $this->status,
            'display_order' => $this->display_order,

            /*
             * How much of the page exists. Loaded with `withCount` by the list
             * screen and absent elsewhere, so the count is never a query per
             * row.
             */
            'counts' => $this->when(
                $this->images_count !== null,
                fn () => [
                    'images' => (int) $this->images_count,
                    'highlights' => (int) $this->highlights_count,
                    'itinerary_days' => (int) $this->itinerary_days_count,
                    'inclusions' => (int) $this->inclusions_count,
                    'exclusions' => (int) $this->exclusions_count,
                ],
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
