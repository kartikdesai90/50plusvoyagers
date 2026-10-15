<?php

namespace App\Http\Resources\Site;

use App\Models\Tour;
use App\Models\TourBookingStep;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * One tour page, as a visitor's browser receives it.
 *
 * Everything the page prints and nothing it does not. The disks and stored
 * paths never leave the server — a visitor gets an address they can fetch.
 *
 * A section that has no rows arrives as an empty array rather than being
 * omitted, so the front end tests one thing (`length`) rather than two
 * (present, and non-empty).
 *
 * @mixin Tour
 */
class TourPageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $departures = $this->departures();
        $next = $departures[0] ?? null;

        // Counted from the CRM's departure, so re-running the tour next year
        // does not mean re-typing every date.
        $start = $next['starts_on'] ?? null;
        $startsOn = $start ? Carbon::parse($start) : null;

        return [
            'slug' => $this->slug,
            'title' => $this->heading(),
            'subtitle' => $this->subtitle,
            'region' => $this->publicRegion(),
            'summary' => $this->summary,
            'ribbon_text' => $this->ribbon_text,
            /*
             * The tour's own picture, where one was chosen. The page falls back
             * to the carousel's cover as it always did, so a tour nobody has
             * set one for looks exactly as it did before.
             */
            'image_url' => $this->imageUrl(),
            'route_map_url' => $this->routeMapUrl(),
            'visa_content' => $this->visa_content,

            'booking_fee' => $this->publicBookingFee(),
            'balance_due_days' => null,

            /*
             * Read from the CRM, never stored here. `departures` is a list
             * because one page serves many: the CRM has two July departures
             * pointing at the same Jog page.
             */
            'departures' => $departures,

            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'url' => $image->imageUrl(),
                /*
                 * The place, printed over the picture — the same field the
                 * gallery wall sets in serif above the caption.
                 *
                 * It was missing here, and the tour page had no title to print
                 * as a result: the card was left to make one out of the caption
                 * or the alt text, so a photograph showed one line where the
                 * identical picture on the gallery page showed two.
                 */
                'title' => $image->title,
                /* The written description, or the caption the gallery
                   already derives one from. */
                'alt' => $image->describedAs(),
                'caption' => $image->caption,
                'is_cover' => $image->is_cover,
            ])->values()->all(), []),

            'highlights' => $this->whenLoaded(
                'highlights',
                fn () => $this->highlights->pluck('content')->values()->all(),
                [],
            ),

            'itinerary' => $this->whenLoaded('itineraryDays', fn () => $this->itineraryDays->map(fn ($day) => [
                'day_number' => $day->day_number,
                'heading' => $day->heading,
                'title' => $day->title,
                'body' => $day->content,
                'stay' => $day->stay,
                'meals' => $day->meals,
                'date' => $day->dateFrom($startsOn)?->format('Y-m-d'),
            ])->values()->all(), []),

            'inclusions' => $this->whenLoaded(
                'inclusions',
                fn () => $this->inclusions->pluck('content')->values()->all(),
                [],
            ),

            'exclusions' => $this->whenLoaded(
                'exclusions',
                fn () => $this->exclusions->pluck('content')->values()->all(),
                [],
            ),

            /*
             * Three lists out of one table. Split here rather than in the front
             * end because the grouping is a fact about the data, not a
             * presentation choice.
             */
            'booking_steps' => $this->stepsOfKind(TourBookingStep::KIND_BOOKING),
            'documents' => $this->stepsOfKind(TourBookingStep::KIND_DOCUMENTS),
            'guidelines' => $this->stepsOfKind(TourBookingStep::KIND_GUIDELINES),

            'testimonials' => $this->whenLoaded('testimonials', fn () => $this->testimonials->map(fn ($quote) => [
                'name' => $quote->customer_name,
                'location' => $quote->customer_location,
                'body' => $quote->feedback_text,
                'rating' => $quote->rating,
            ])->values()->all(), []),

            /* For the page's own <head>. Carried across verbatim. */
            'meta_title' => $this->metaTitle(),
            'meta_description' => $this->metaDescription(),
            'meta_keywords' => $this->meta_keywords,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'og_image_url' => $this->ogImageUrl(),
            'canonical_url' => $this->canonical_url,
        ];
    }

    /** @return list<array<string, mixed>> */
    private function stepsOfKind(string $kind): array
    {
        if (!$this->relationLoaded('bookingSteps')) {
            return [];
        }

        return $this->bookingSteps
            ->where('kind', $kind)
            ->map(fn ($step) => [
                'number' => $step->step_number,
                'body' => $step->content,
            ])
            ->values()
            ->all();
    }
}
