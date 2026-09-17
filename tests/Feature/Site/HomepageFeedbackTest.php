<?php

namespace Tests\Feature\Site;

use App\Models\Feedback;
use Database\Seeders\FeedbackSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * What the homepage's two feedback bands are given, and what they are not.
 *
 * The rules an editor has to be able to trust are the same ones the bands module
 * enforces — switched off is gone, and their order is the order — and they are
 * enforced on the server for the same reason: the page must not be in a position
 * to disagree with the admin about either.
 *
 * The one rule of its own is the split. Written and filmed feedback are one
 * table and one screen, but two bands of the page, and a quote must never
 * surface in the films row or the other way about.
 */
class HomepageFeedbackTest extends TestCase
{
    use RefreshDatabase;

    /** What the homepage is handed. Named for what it is, not for its address. */
    private function content(): TestResponse
    {
        return $this->getJson('/api/site/home')->assertOk();
    }

    /** @return array<string, mixed> */
    private function quote(array $overrides = []): array
    {
        return array_merge([
            'type' => 'text',
            'customer_name' => 'Kamala Iyer, 71',
            'customer_location' => 'Bhutan: The Happy Kingdom · 2025',
            'feedback_text' => '“I only wish I hadn’t waited.”',
            'photo_path' => '/images/home/face-kamala.webp',
            'is_active' => true,
            'display_order' => 0,
        ], $overrides);
    }

    /** @return array<string, mixed> */
    private function film(array $overrides = []): array
    {
        return array_merge([
            'type' => 'video',
            'customer_name' => 'Malika',
            'customer_location' => 'Grandmother of three · Rajasthan ’25',
            'thumbnail_path' => '/images/home/face-malika.webp',
            'is_active' => true,
            'display_order' => 0,
        ], $overrides);
    }

    public function test_the_homepage_is_given_both_kinds_of_feedback(): void
    {
        Feedback::create($this->quote());
        Feedback::create($this->film());

        $this->content()
            ->assertJsonCount(1, 'toasts')
            ->assertJsonCount(1, 'films')
            ->assertJsonPath('toasts.0.name', 'Kamala Iyer, 71')
            ->assertJsonPath('toasts.0.quote', '“I only wish I hadn’t waited.”')
            ->assertJsonPath('films.0.name', 'Malika')
            ->assertJsonPath('films.0.thumbnail_url', '/images/home/face-malika.webp');
    }

    /**
     * One table, two bands. A written quote appearing in the films row would be
     * a card with no film in it.
     */
    public function test_the_two_bands_never_receive_each_other_s_records(): void
    {
        Feedback::create($this->quote());
        Feedback::create($this->film());

        $this->content()
            ->assertJsonPath('toasts.0.type', 'text')
            ->assertJsonPath('films.0.type', 'video');
    }

    public function test_hidden_feedback_does_not_reach_the_page(): void
    {
        Feedback::create($this->quote(['customer_name' => 'Showing']));
        Feedback::create($this->quote(['customer_name' => 'Hidden', 'is_active' => false]));
        Feedback::create($this->film(['customer_name' => 'Filmed', 'is_active' => false]));

        $this->content()
            ->assertJsonCount(1, 'toasts')
            ->assertJsonCount(0, 'films')
            ->assertJsonPath('toasts.0.name', 'Showing');
    }

    public function test_the_order_an_editor_set_is_the_order_the_page_gets(): void
    {
        Feedback::create($this->quote(['customer_name' => 'Third', 'display_order' => 30]));
        Feedback::create($this->quote(['customer_name' => 'First', 'display_order' => 10]));
        Feedback::create($this->quote(['customer_name' => 'Second', 'display_order' => 20]));

        $this->content()
            ->assertJsonPath('toasts.0.name', 'First')
            ->assertJsonPath('toasts.1.name', 'Second')
            ->assertJsonPath('toasts.2.name', 'Third');
    }

    /**
     * A film may arrive as a link or as an upload. The page is told where it
     * is, never which of the two an editor happened to use.
     */
    public function test_a_film_reaches_the_page_as_one_resolved_address(): void
    {
        Feedback::create($this->film(['video_url' => 'https://youtu.be/abc123']));

        $this->content()
            ->assertJsonPath('films.0.video_source', 'https://youtu.be/abc123')
            ->assertJsonMissingPath('films.0.video_url')
            ->assertJsonMissingPath('films.0.video_path');
    }

    /** Which card renders taller is a layout fact, so it does travel. */
    public function test_the_featured_film_is_identified_to_the_page(): void
    {
        Feedback::create($this->film(['customer_name' => 'Plain']));
        Feedback::create($this->film([
            'customer_name' => 'Featured',
            'is_featured' => true,
            'display_order' => 1,
        ]));

        $this->content()
            ->assertJsonPath('films.0.is_featured', false)
            ->assertJsonPath('films.1.is_featured', true);
    }

    /**
     * Running the business is not the public's concern: whether a record is
     * switched off, where it sits in the order and which tour it is filed
     * against all stay on the server.
     */
    public function test_the_page_is_not_told_how_the_feedback_is_managed(): void
    {
        Feedback::create($this->quote());

        $this->content()
            ->assertJsonMissingPath('toasts.0.is_active')
            ->assertJsonMissingPath('toasts.0.display_order')
            ->assertJsonMissingPath('toasts.0.tour_id')
            ->assertJsonMissingPath('toasts.0.photo_path')
            ->assertJsonMissingPath('toasts.0.created_at');
    }

    /** A site with nothing stored still has a homepage. */
    public function test_an_empty_table_gives_the_page_empty_lists_rather_than_failing(): void
    {
        $this->content()
            ->assertJsonCount(0, 'toasts')
            ->assertJsonCount(0, 'films');
    }

    public function test_the_seeded_bands_match_the_design_they_replace(): void
    {
        $this->seed(FeedbackSeeder::class);

        $this->content()
            ->assertJsonCount(6, 'toasts')
            ->assertJsonCount(3, 'films')
            ->assertJsonPath('toasts.0.name', 'Kamala Iyer, 71')
            ->assertJsonPath('toasts.5.name', 'Nirmala Reddy, 59')
            // The featured card renders taller, so it has to be the middle
            // one of the three or the row is lopsided.
            ->assertJsonPath('films.1.name', 'Malika')
            ->assertJsonPath('films.1.is_featured', true)
            ->assertJsonPath('films.0.is_featured', false)
            ->assertJsonPath('films.2.is_featured', false);

        // Seeding twice must not give the homepage two of every quote.
        $this->seed(FeedbackSeeder::class);
        $this->assertSame(9, Feedback::count());
    }
}
