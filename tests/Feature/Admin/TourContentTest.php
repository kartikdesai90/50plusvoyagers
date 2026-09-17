<?php

namespace Tests\Feature\Admin;

use App\Models\Tour;
use App\Models\TourBookingStep;
use App\Models\TourItineraryDay;
use App\Models\TourListItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The repeating blocks of a tour page, as an editor maintains them.
 *
 * Until this endpoint existed the seven lists had tables, models and a public
 * page that rendered them, but no way into them except `php artisan
 * tour:import` against a saved HTML file. So what is worth testing is not that
 * Eloquent writes a row, but the handful of rules that make a save of a *set*
 * safe: that saving one list does not empty the one sharing its table, that an
 * itinerary can be reordered across a unique index, that a row belonging to
 * another tour cannot be dragged into this one, and that an empty list means
 * "remove these" rather than "leave them alone".
 */
class TourContentTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create();
    }

    private function tour(array $attributes = []): Tour
    {
        return Tour::create([
            'tour_code' => 'SpainPortugal23092026',
            'tour_name' => 'Spain Portugal 23 September - 5 October 2026',
            'slug' => 'spain-portugal',
            ...$attributes,
        ]);
    }

    /** Every list has to be sent, so the payload below is the empty page. */
    private function payload(array $lists = []): array
    {
        return [
            'highlights' => [],
            'inclusions' => [],
            'exclusions' => [],
            'itinerary' => [],
            'booking_steps' => [],
            'documents' => [],
            'guidelines' => [],
            ...$lists,
        ];
    }

    public function test_the_content_api_refuses_an_anonymous_request(): void
    {
        $tour = $this->tour();

        $this->getJson("/api/admin/tours/{$tour->id}/content")->assertUnauthorized();
        $this->postJson("/api/admin/tours/{$tour->id}/content", $this->payload())
            ->assertUnauthorized();
    }

    /** A tour nobody has written yet reads as empty lists, never as nulls. */
    public function test_a_tour_with_no_content_reads_as_empty_lists(): void
    {
        $tour = $this->tour();

        $response = $this->actingAs($this->admin())
            ->getJson("/api/admin/tours/{$tour->id}/content")
            ->assertOk();

        foreach (['highlights', 'inclusions', 'exclusions', 'itinerary',
            'booking_steps', 'documents', 'guidelines'] as $list) {
            $this->assertSame([], $response->json("data.{$list}"), "{$list} should be empty");
        }
    }

    public function test_an_editor_writes_the_whole_page_in_one_save(): void
    {
        $tour = $this->tour();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [['body' => 'Stay in a coffee estate.']],
                'inclusions' => [['body' => 'AC bus from Bangalore.']],
                'exclusions' => [['body' => 'Travel insurance.']],
                'itinerary' => [[
                    'heading' => 'Day 1: Arrive Porto',
                    'title' => "Portugal's riverside rebel",
                    'body' => 'Prose about the day.',
                    'stay' => '4* Hotel in Porto',
                    'meals' => 'Dinner',
                ]],
                'booking_steps' => [['body' => 'Call us to request a booking.']],
                'documents' => [['body' => 'Original passport.']],
                'guidelines' => [['body' => 'You must walk at a good pace.']],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.highlights')
            ->assertJsonPath('data.itinerary.0.day_number', 1)
            ->assertJsonPath('data.itinerary.0.stay', '4* Hotel in Porto')
            ->assertJsonPath('data.documents.0.body', 'Original passport.');

        $this->assertDatabaseCount('tour_list_items', 3);
        $this->assertDatabaseCount('tour_booking_steps', 3);
        $this->assertDatabaseCount('tour_itinerary_days', 1);
    }

    /**
     * The decision that justified one table for three lists, tested from the
     * side that could undo it.
     *
     * The highlights, inclusions and exclusions are all `tour_list_items` rows
     * with the same `tour_id`. A sync that matched on the tour rather than on
     * the kind would delete the other two lists every time one was saved.
     */
    public function test_saving_one_list_leaves_the_lists_sharing_its_table_alone(): void
    {
        $tour = $this->tour();

        foreach ([TourListItem::KIND_INCLUSION, TourListItem::KIND_EXCLUSION] as $kind) {
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => $kind,
                'content' => "An existing {$kind}",
            ]);
        }

        TourBookingStep::create([
            'tour_id' => $tour->id,
            'kind' => TourBookingStep::KIND_DOCUMENTS,
            'step_number' => 1,
            'content' => 'An existing document',
        ]);

        /* Only the highlights and booking steps are given content. The others
           are sent as they already are, which must leave them untouched. */
        $stored = $this->actingAs($this->admin())
            ->getJson("/api/admin/tours/{$tour->id}/content")
            ->json('data');

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [['body' => 'A new highlight']],
                'inclusions' => $stored['inclusions'],
                'exclusions' => $stored['exclusions'],
                'documents' => $stored['documents'],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.highlights')
            ->assertJsonCount(1, 'data.inclusions')
            ->assertJsonCount(1, 'data.exclusions')
            ->assertJsonCount(1, 'data.documents');

        $this->assertDatabaseHas('tour_list_items', ['content' => 'An existing inclusion']);
        $this->assertDatabaseHas('tour_booking_steps', ['content' => 'An existing document']);
    }

    /**
     * `tour_itinerary_days` is uniquely indexed on `(tour_id, day_number)` and
     * the numbers are recomputed from row order, so swapping two days means two
     * rows momentarily claiming the same number. The save parks the stored
     * numbers out of range first; without that this is a constraint violation.
     */
    public function test_an_itinerary_can_be_reordered(): void
    {
        $tour = $this->tour();

        foreach (['Day 1: Porto', 'Day 2: Lisbon', 'Day 3: Seville'] as $index => $heading) {
            TourItineraryDay::create([
                'tour_id' => $tour->id,
                'day_number' => $index + 1,
                'heading' => $heading,
                'content' => 'Prose.',
                'display_order' => $index,
            ]);
        }

        $days = $this->actingAs($this->admin())
            ->getJson("/api/admin/tours/{$tour->id}/content")
            ->json('data.itinerary');

        /* Reversed, which makes every row's number collide with another's. */
        $reversed = array_map(
            fn ($day) => ['id' => $day['id'], 'heading' => $day['heading'], 'body' => $day['body']],
            array_reverse($days),
        );

        $response = $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'itinerary' => $reversed,
            ]))
            ->assertOk();

        $this->assertSame(
            ['Day 3: Seville', 'Day 2: Lisbon', 'Day 1: Porto'],
            array_column($response->json('data.itinerary'), 'heading'),
        );

        /* Renumbered from one, in the new order — not carried over. */
        $this->assertSame([1, 2, 3], array_column($response->json('data.itinerary'), 'day_number'));
        $this->assertDatabaseCount('tour_itinerary_days', 3);
    }

    /** A row left out of the payload is a row taken off the page. */
    public function test_a_row_left_out_of_the_save_is_removed(): void
    {
        $tour = $this->tour();

        foreach (['Keep me', 'Remove me'] as $body) {
            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_HIGHLIGHT,
                'content' => $body,
            ]);
        }

        $kept = collect(
            $this->actingAs($this->admin())
                ->getJson("/api/admin/tours/{$tour->id}/content")
                ->json('data.highlights')
        )->firstWhere('body', 'Keep me');

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [$kept],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.highlights')
            ->assertJsonPath('data.highlights.0.body', 'Keep me');

        $this->assertDatabaseMissing('tour_list_items', ['content' => 'Remove me']);
    }

    /**
     * An editor who presses Add and thinks better of it has left a blank row,
     * not made a mistake. It is dropped rather than reported.
     */
    public function test_an_empty_row_is_dropped_rather_than_refused(): void
    {
        $tour = $this->tour();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [
                    ['body' => 'A real highlight'],
                    ['body' => '   '],
                    ['body' => ''],
                ],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.highlights');
    }

    /**
     * These columns are named `content` but hold prose.
     *
     * The importer stores plain text and the public page strips any markup it
     * finds before rendering — deliberately, because injecting editor-typed
     * content as HTML would be an XSS hole on every tour page. So tags pasted
     * from Word are never shown; storing them would only put junk in the
     * database and ship it over the wire to be thrown away.
     */
    public function test_markup_pasted_from_a_word_processor_is_stored_as_prose(): void
    {
        $tour = $this->tour();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [
                    ['body' => '<p>Stay in a <strong>working coffee estate</strong>.</p>'],
                ],
                'itinerary' => [[
                    'heading' => '<h4>Day 1: Arrive Porto</h4>',
                    'body' => '<p>Land at midday.</p><p>Dinner by the river.</p>',
                    'stay' => '<span>4* Hotel</span>',
                ]],
            ]))
            ->assertOk()
            ->assertJsonPath('data.highlights.0.body', 'Stay in a working coffee estate.')
            ->assertJsonPath('data.itinerary.0.heading', 'Day 1: Arrive Porto')
            ->assertJsonPath('data.itinerary.0.stay', '4* Hotel')
            /* The paragraph break survives as a newline, which is what the page
               renders through `whitespace-pre-line`. */
            ->assertJsonPath('data.itinerary.0.body', "Land at midday.\nDinner by the river.");
    }

    /**
     * Word's empty paragraph is `<p>&nbsp;</p>`.
     *
     * An editor who pressed Add, pasted nothing and moved on believes that row
     * is empty. Cleaning the markup before the emptiness test is what lets the
     * save agree with them — the other order stores a lone space and the page
     * prints a blank bullet.
     */
    public function test_a_row_holding_only_empty_markup_is_dropped(): void
    {
        $tour = $this->tour();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [
                    ['body' => 'A real highlight'],
                    ['body' => '<p>&nbsp;</p>'],
                    ['body' => '<div><br></div>'],
                ],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.highlights')
            ->assertJsonPath('data.highlights.0.body', 'A real highlight');
    }

    /**
     * Stripping the tags alone would leave the code behind as visible text, so
     * script and style are removed with their contents.
     */
    public function test_a_script_paste_leaves_nothing_behind(): void
    {
        $tour = $this->tour();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [
                    ['body' => 'Safe<script>alert("xss")</script> to read.'],
                ],
            ]))
            ->assertOk()
            ->assertJsonPath('data.highlights.0.body', 'Safe to read.');

        $this->assertDatabaseMissing('tour_list_items', ['content' => 'alert("xss")']);
    }

    /**
     * A day is kept on its heading alone — "Day 7: At leisure" is a complete
     * day — but a day with no heading at all is an abandoned row.
     */
    public function test_a_day_needs_a_heading_but_not_prose(): void
    {
        $tour = $this->tour();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'itinerary' => [
                    ['heading' => 'Day 7: At leisure'],
                    ['heading' => '  ', 'body' => 'Orphaned prose.'],
                ],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.itinerary')
            ->assertJsonPath('data.itinerary.0.heading', 'Day 7: At leisure')
            ->assertJsonPath('data.itinerary.0.body', '');
    }

    /**
     * The numbered lists print their number, so it has to agree with the order
     * rather than being a second opinion the browser supplies.
     */
    public function test_the_numbered_lists_are_numbered_from_their_order(): void
    {
        $tour = $this->tour();

        $response = $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'booking_steps' => [
                    ['body' => 'First step'],
                    ['body' => 'Second step'],
                    ['body' => 'Third step'],
                ],
            ]))
            ->assertOk();

        $this->assertSame([1, 2, 3], array_column($response->json('data.booking_steps'), 'number'));
    }

    /**
     * A payload naming another tour's row must not be able to move it here.
     *
     * Validating that the id exists would not have caught this — it does exist,
     * it just belongs to somebody else. The row is looked up among this tour's
     * own rows, so an unmatched id creates a new row and the other tour keeps
     * what it had.
     */
    public function test_a_row_belonging_to_another_tour_cannot_be_claimed(): void
    {
        $mine = $this->tour();
        $theirs = $this->tour(['tour_code' => 'Coorg30052026', 'tour_name' => 'Coorg', 'slug' => 'coorg']);

        $stolen = TourListItem::create([
            'tour_id' => $theirs->id,
            'kind' => TourListItem::KIND_HIGHLIGHT,
            'content' => 'Belongs to Coorg',
        ]);

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$mine->id}/content", $this->payload([
                'highlights' => [['id' => $stolen->id, 'body' => 'Stolen']],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.highlights');

        /* Still Coorg's, still saying what it said. */
        $this->assertDatabaseHas('tour_list_items', [
            'id' => $stolen->id,
            'tour_id' => $theirs->id,
            'content' => 'Belongs to Coorg',
        ]);
    }

    /** A list that is not sent at all is a mistake, not an empty list. */
    public function test_every_list_must_be_present(): void
    {
        $tour = $this->tour();

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'highlights', 'inclusions', 'exclusions',
                'itinerary', 'booking_steps', 'documents', 'guidelines',
            ]);
    }

    /** The editor's order is what the public page reads back. */
    public function test_the_saved_order_is_the_order_read_back(): void
    {
        $tour = $this->tour(['status' => Tour::STATUS_PUBLISHED]);

        $this->actingAs($this->admin())
            ->postJson("/api/admin/tours/{$tour->id}/content", $this->payload([
                'highlights' => [
                    ['body' => 'First'],
                    ['body' => 'Second'],
                    ['body' => 'Third'],
                ],
            ]))
            ->assertOk();

        $this->assertSame(
            ['First', 'Second', 'Third'],
            $this->getJson('/api/site/tours/spain-portugal')->json('data.highlights'),
        );
    }
}
