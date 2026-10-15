<?php

namespace App\Http\Resources\Site;

use App\Models\Tour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One tour as a card — on the homepage, the listing, and "other departures".
 *
 * The smallest thing that can be clicked. Above all it carries the `slug`,
 * because a card whose only job is to lead somewhere is useless without one:
 * the homepage's cards used to link to `#trips`, an anchor pointing at
 * themselves, and that is exactly the bug this exists to fix.
 *
 * Price, dates and nights come from the CRM rather than from our columns, so a
 * card and the page it opens can never quote different figures. When the CRM
 * cannot be reached they are simply null and the card says so, which is
 * honest — a card inventing a price would be worse than a card without one.
 *
 * @mixin Tour
 */
class TourCardResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $next = $this->departures()[0] ?? null;

        $cover = $this->relationLoaded('images')
            ? ($this->images->firstWhere('is_cover', true) ?? $this->images->first())
            : null;

        /*
         * The tour's own picture leads, and the carousel's cover stands in
         * where none was set. That order is what makes the field worth having:
         * an editor who chooses a lead image is overruling the guess, and a
         * tour nobody has chosen one for keeps the picture it already showed.
         */
        $image = $this->imageUrl();

        return [
            'slug' => $this->slug,
            'title' => $this->heading(),
            'subtitle' => $this->subtitle,
            'region' => $this->publicRegion(),
            'ribbon_text' => $this->ribbon_text,

            'image_url' => $image ?? $cover?->imageUrl(),
            'image_alt' => $image !== null ? $this->heading() : $cover?->describedAs(),

            /* From the CRM, live. Null when it cannot be reached. */
            'starts_on' => $next['starts_on'] ?? null,
            'nights' => $next['nights'] ?? null,
            'price' => $next['price'] ?? null,
            'booking_open' => $next['booking_open'] ?? null,

            /*
             * The month the next departure leaves in, as `2026-09`. The
             * homepage's calendar filters on it, and taking it off the ISO
             * string rather than through a date object is what stops a
             * departure sliding into the previous month for a reader west of
             * Greenwich.
             */
            'month' => isset($next['starts_on'])
                ? substr((string) $next['starts_on'], 0, 7)
                : null,
        ];
    }
}
