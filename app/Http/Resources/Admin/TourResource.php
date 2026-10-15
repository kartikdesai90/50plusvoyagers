<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One tour as its editor sees it.
 *
 * The page's own fields, plus a snapshot of the matching CRM departure so the
 * panel can show dates, price and category without letting anyone edit a
 * second copy of them.
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
        $next = $this->nextDeparture();

        return [
            'id' => $this->id,

            'tour_code' => $this->tour_code,
            'tour_name' => $this->tour_name,

            /* The page. */
            'slug' => $this->slug,
            'page_title' => $this->page_title,
            'subtitle' => $this->subtitle,
            'summary' => $this->summary,
            'ribbon_text' => $this->ribbon_text,
            'image_url' => $this->imageUrl(),
            'route_map_url' => $this->routeMapUrl(),
            'visa_content' => $this->visa_content,

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image_url' => $this->ogImageUrl(),
            'canonical_url' => $this->canonical_url,

            'display_order' => $this->display_order,

            /*
             * Live from `tb_group_tour`. Null when this code has no upcoming
             * departure — the form then says so rather than inventing blanks
             * an editor might try to type into. `status` here is the CRM's
             * `tour_status`, not a copy on `tours`.
             */
            'crm' => $next === null ? null : [
                'tour_code' => $next['tour_code'] ?? null,
                'starts_on' => $this->plainDate($next['starts_on'] ?? null),
                'ends_on' => $this->plainDate($next['ends_on'] ?? null),
                'nights' => $next['nights'] ?? null,
                'price' => $next['price'] ?? null,
                'advance' => ($next['advance'] ?? 0) > 0 ? $next['advance'] : null,
                'category' => $this->publicRegion(),
                'status' => ($next['status'] ?? '') !== '' ? $next['status'] : null,
                'website_link' => ($next['website_link'] ?? '') !== '' ? $next['website_link'] : null,
                'booking_open' => $next['booking_open'] ?? null,
            ],

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

    private function plainDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return substr((string) $value, 0, 10);
    }
}
