<?php

namespace Tests\Feature\Site;

use App\Models\Feedback;
use App\Models\GalleryItem;
use App\Models\Tour;
use App\Models\TourBookingStep;
use App\Models\TourItineraryDay;
use App\Models\TourListItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * One tour page, as a visitor receives it.
 *
 * What is worth testing here is not that Eloquent can load a relation, but the
 * handful of decisions the page depends on: that a draft is not readable, that
 * the three numbered lists come back separated, that testimonials obey the
 * Feedback module's own approval rules, and that the meta tags carried over
 * from the old site survive the trip.
 */
class TourPageTest extends TestCase
{
    use RefreshDatabase;

    private function tour(array $attributes = []): Tour
    {
        return Tour::create([
            'tour_code' => 'SpainPortugal23092026',
            'tour_name' => 'Spain Portugal 23 September - 5 October 2026',
            'slug' => 'spain-portugal',
            'page_title' => 'Spain and Portugal: A Tale of Two Kingdoms',
            ...$attributes,
        ]);
    }

    public function test_a_published_tour_is_readable(): void
    {
        $this->tour();

        $this->getJson('/api/site/tours/spain-portugal')
            ->assertOk()
            ->assertJsonPath('data.slug', 'spain-portugal')
            /* The page's own H1, not the CRM's name for the departure. */
            ->assertJsonPath('data.title', 'Spain and Portugal: A Tale of Two Kingdoms');
    }

    public function test_a_page_without_an_address_cannot_be_read(): void
    {
        $this->tour(['slug' => null]);

        $this->getJson('/api/site/tours/spain-portugal')->assertNotFound();
    }

    /**
     * A tour recorded from the CRM but never written has no page. It must not
     * be reachable, and the listing must not offer it.
     */
    public function test_a_tour_without_an_address_is_not_published(): void
    {
        Tour::create([
            'tour_code' => 'Jog07072026',
            'tour_name' => 'Jog Waterfall',
        ]);

        $this->getJson('/api/site/tours')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_an_address_with_nothing_at_it_is_not_found(): void
    {
        $this->getJson('/api/site/tours/no-such-tour')->assertNotFound();
    }

    public function test_the_itinerary_arrives_in_day_order(): void
    {
        $tour = $this->tour();

        /* Created out of order on purpose. */
        foreach ([3, 1, 2] as $number) {
            TourItineraryDay::create([
                'tour_id' => $tour->id,
                'day_number' => $number,
                'heading' => "Day {$number}",
                'content' => 'Prose.',
            ]);
        }

        $response = $this->getJson('/api/site/tours/spain-portugal')->assertOk();

        $this->assertSame([1, 2, 3], array_column($response->json('data.itinerary'), 'day_number'));
    }

    /**
     * The three numbered lists share one table and must come back apart.
     *
     * This is the decision that justified one table instead of three, so it is
     * the one worth pinning down.
     */
    public function test_the_three_numbered_lists_are_separated_by_kind(): void
    {
        $tour = $this->tour();

        foreach ([
            [TourBookingStep::KIND_BOOKING, 'Call us to request a booking.'],
            [TourBookingStep::KIND_DOCUMENTS, 'Original passport, six months valid.'],
            [TourBookingStep::KIND_DOCUMENTS, 'Two colour photographs.'],
            [TourBookingStep::KIND_GUIDELINES, 'You must be able to walk at a good pace.'],
        ] as $index => [$kind, $body]) {
            TourBookingStep::create([
                'tour_id' => $tour->id,
                'kind' => $kind,
                'step_number' => $index + 1,
                'content' => $body,
            ]);
        }

        $this->getJson('/api/site/tours/spain-portugal')
            ->assertOk()
            ->assertJsonCount(1, 'data.booking_steps')
            ->assertJsonCount(2, 'data.documents')
            ->assertJsonCount(1, 'data.guidelines')
            ->assertJsonPath('data.documents.0.body', 'Original passport, six months valid.');
    }

    /**
     * Testimonials are the Feedback module's rows, not a table of this
     * module's own — so they must obey its approval rules.
     */
    public function test_testimonials_come_from_the_feedback_module_and_respect_its_rules(): void
    {
        $tour = $this->tour();

        Feedback::create([
            'type' => 'text',
            'customer_name' => 'S Ravikumar',
            'customer_location' => 'Bangalore',
            'feedback_text' => 'Wonderful tour.',
            'tour_id' => $tour->id,
            'is_active' => true,
            'is_featured' => false,
            'display_order' => 0,
        ]);

        /* Switched off by an editor: it must not reach a public page. */
        Feedback::create([
            'type' => 'text',
            'customer_name' => 'Hidden',
            'feedback_text' => 'Not approved.',
            'tour_id' => $tour->id,
            'is_active' => false,
            'is_featured' => false,
            'display_order' => 1,
        ]);

        /* Another tour's quote must not appear on this one. */
        Feedback::create([
            'type' => 'text',
            'customer_name' => 'Elsewhere',
            'feedback_text' => 'Different tour.',
            'tour_id' => null,
            'is_active' => true,
            'is_featured' => false,
            'display_order' => 2,
        ]);

        $this->getJson('/api/site/tours/spain-portugal')
            ->assertOk()
            ->assertJsonCount(1, 'data.testimonials')
            ->assertJsonPath('data.testimonials.0.name', 'S Ravikumar')
            ->assertJsonPath('data.testimonials.0.location', 'Bangalore');
    }

    /**
     * A photograph carries a title and a caption, and the page needs both.
     *
     * The title is the serif heading over the picture and the caption is the
     * line beneath it — that is how the gallery wall prints the same row. This
     * resource sent the caption and the alt but not the title, so a tour's card
     * had nothing to head it and printed one line where the identical
     * photograph two pages away printed two.
     */
    public function test_a_photograph_carries_its_title_as_well_as_its_caption(): void
    {
        $tour = $this->tour();

        GalleryItem::create([
            'tour_id' => $tour->id,
            'title' => 'Porto',
            'caption' => 'The evening we arrived',
            'image_path' => 'gallery/porto.webp',
            'is_active' => true,
            'is_cover' => true,
            'display_order' => 0,
        ]);

        $this->getJson('/api/site/tours/spain-portugal')
            ->assertOk()
            ->assertJsonPath('data.images.0.title', 'Porto')
            ->assertJsonPath('data.images.0.caption', 'The evening we arrived')
            /* Derived, so the picture and the words about it cannot disagree. */
            ->assertJsonPath('data.images.0.alt', 'The evening we arrived');
    }

    /**
     * The client's explicit requirement: the existing meta and H1 text must
     * survive the move, because the pages already rank on it.
     */
    public function test_the_meta_tags_are_carried_across_verbatim(): void
    {
        $title = 'Senior Citizens Group Tour: Spain and Portugal: A Tale of Two Kingdoms | 50plusvoyagers.com, India';

        $this->tour([
            'meta_title' => $title,
            'meta_description' => 'Senior Citizen Tour to Spain and Portugal.',
            'meta_keywords' => 'Europe tour packages, Senior Citizen Europe Tour',
        ]);

        $this->getJson('/api/site/tours/spain-portugal')
            ->assertOk()
            ->assertJsonPath('data.meta_title', $title)
            ->assertJsonPath('data.meta_keywords', 'Europe tour packages, Senior Citizen Europe Tour');
    }

    /** With nothing written, the page still tells a crawler something true. */
    public function test_the_meta_title_falls_back_to_the_heading(): void
    {
        $this->tour(['summary' => 'Two kingdoms, thirteen days.']);

        $this->getJson('/api/site/tours/spain-portugal')
            ->assertOk()
            ->assertJsonPath('data.meta_title', 'Spain and Portugal: A Tale of Two Kingdoms')
            ->assertJsonPath('data.meta_description', 'Two kingdoms, thirteen days.');
    }

    /** Every list is present and empty rather than absent, so the front end tests one thing. */
    public function test_a_tour_with_no_content_returns_empty_lists_rather_than_nulls(): void
    {
        $this->tour();

        $response = $this->getJson('/api/site/tours/spain-portugal')->assertOk();

        foreach (['images', 'highlights', 'itinerary', 'inclusions', 'exclusions',
            'booking_steps', 'documents', 'guidelines', 'testimonials', 'departures'] as $key) {
            $this->assertSame([], $response->json("data.{$key}"), "{$key} should be an empty list");
        }
    }

    public function test_the_lists_come_back_in_the_editors_order(): void
    {
        $tour = $this->tour();

        foreach ([['Third', 2], ['First', 0], ['Second', 1]] as [$body, $order]) {
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_HIGHLIGHT,
                'content' => $body,
                'display_order' => $order,
            ]);
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_EXCLUSION,
                'content' => $body,
                'display_order' => $order,
            ]);
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_INCLUSION,
                'content' => $body,
                'display_order' => $order,
            ]);
        }

        $response = $this->getJson('/api/site/tours/spain-portugal')->assertOk();

        $this->assertSame(['First', 'Second', 'Third'], $response->json('data.highlights'));
        $this->assertSame(['First', 'Second', 'Third'], $response->json('data.exclusions'));
        $this->assertSame(['First', 'Second', 'Third'], $response->json('data.inclusions'));
    }

    /** Removing a tour takes its page with it. */
    public function test_deleting_a_tour_cascades_to_its_content(): void
    {
        $tour = $this->tour();

        TourListItem::create([
            'tour_id' => $tour->id,
            'kind' => TourListItem::KIND_HIGHLIGHT,
            'content' => 'A highlight',
        ]);
        TourItineraryDay::create([
            'tour_id' => $tour->id,
            'day_number' => 1,
            'heading' => 'Day 1',
            'content' => 'Prose.',
        ]);

        $tour->delete();

        $this->assertDatabaseCount('tour_list_items', 0);
        $this->assertDatabaseCount('tour_itinerary_days', 0);
    }

    /** The index feeds the sitemap and the prerender list. */
    public function test_the_index_lists_published_tours_only(): void
    {
        $this->tour();
        $this->tour([
            'tour_code' => 'Coorg30052026',
            'tour_name' => 'Coorg',
            'slug' => null,
        ]);

        $this->getJson('/api/site/tours')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'spain-portugal');
    }

    /** Price, dates, category and deposit come from tb_group_tour, not from tours. */
    public function test_the_page_quotes_the_crm_rather_than_copied_columns(): void
    {
        $starts = Carbon::today()->addMonths(2)->toDateString();
        $ends = Carbon::today()->addMonths(2)->addDays(12)->toDateString();

        $this->tour();

        DB::table('tb_group_tour')->insert([
            'tour_code' => 'SpainPortugal'.$starts,
            'tour_name' => 'Spain & Portugal',
            'tour_short_name' => 'Spain & Portugal',
            'tour_big_name' => 'Spain & Portugal',
            'tour_website_name' => 'Spain & Portugal',
            'tour_start_date' => $starts,
            'tour_end_date' => $ends,
            'tour_days' => 13,
            'tour_nights' => 12,
            'tour_status' => 'Active',
            'tour_booking_status' => 'Booking Open',
            'tour_category' => 'International',
            'package_cost' => 554000,
            'senior_discount' => 0,
            'early_bird_discount' => 0,
            'early_bird_status' => 0,
            'single_supplement_cost' => 0,
            'triple_occu_cost' => 0,
            'tour_advance' => 50000,
            'total_rooms_booked' => 0,
            'rooms_details' => '',
            'rooms_occupied' => '',
            'room_available' => '',
            'operations' => '',
            'tour_manager_name' => '',
            'tm_flight_train_status' => '',
            'tour_feedback' => '',
            'tour_website_link' => '/grouptour/spain-portugal.html',
            'trf_link' => '',
        ]);

        $this->getJson('/api/site/tours/spain-portugal')
            ->assertOk()
            ->assertJsonPath('data.region', 'International')
            ->assertJsonPath('data.booking_fee', 50000)
            ->assertJsonPath('data.departures.0.price', 554000)
            ->assertJsonPath('data.departures.0.starts_on', $starts)
            ->assertJsonPath('data.departures.0.ends_on', $ends);

        $this->getJson('/api/site/tours')
            ->assertOk()
            ->assertJsonPath('data.0.region', 'International')
            ->assertJsonPath('data.0.price', 554000);
    }
}
