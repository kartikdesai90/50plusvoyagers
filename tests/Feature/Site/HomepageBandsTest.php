<?php

namespace Tests\Feature\Site;

use App\Models\HeroBanner;
use Database\Seeders\HeroBannerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * What the homepage is given, and what it is not.
 *
 * The two rules that decide whether an editor can trust this module — a band
 * switched off is gone, and the order they set is the order it renders in —
 * are enforced on the server, because the page must not be in a position to
 * disagree with the admin about either.
 *
 * The homepage is a Next route now and Laravel answers it with JSON rather than
 * an Inertia page, so these read the endpoint instead of the props. Nothing
 * about what is being asserted has changed: the same four sets, resolved by the
 * same queries through the same resources.
 */
class HomepageBandsTest extends TestCase
{
    use RefreshDatabase;

    /** What the homepage is handed. Named for what it is, not for its address. */
    private function content(): TestResponse
    {
        return $this->getJson('/api/site/home')->assertOk();
    }

    /** @return array<string, mixed> */
    private function band(array $overrides = []): array
    {
        return array_merge([
            'section_type' => 'hero',
            'media_path' => '/images/home/hero-mountain-lake.webp',
            'heading' => 'See the world like you *mean* it.',
            'is_active' => true,
            'display_order' => 0,
        ], $overrides);
    }

    public function test_the_homepage_is_given_its_hero_slides_and_banners(): void
    {
        HeroBanner::create($this->band());
        HeroBanner::create($this->band([
            'section_type' => 'banner',
            'media_path' => '/images/home/divider-zanskar-rafting.webp',
            'heading' => 'Adventure never asks how old you are.',
            'button_text' => 'See where we go',
            'button_url' => '#trips',
        ]));

        $this->content()
            ->assertJsonCount(1, 'hero')
            ->assertJsonCount(1, 'banners')
            ->assertJsonPath('banners.0.button.text', 'See where we go');
    }

    public function test_a_hidden_band_does_not_reach_the_page(): void
    {
        HeroBanner::create($this->band(['heading' => 'Showing']));
        HeroBanner::create($this->band(['heading' => 'Hidden', 'is_active' => false]));

        $this->content()
            ->assertJsonCount(1, 'hero')
            ->assertJsonPath('hero.0.heading', 'Showing');
    }

    public function test_the_order_an_editor_set_is_the_order_the_page_gets(): void
    {
        HeroBanner::create($this->band(['heading' => 'Third', 'display_order' => 30]));
        HeroBanner::create($this->band(['heading' => 'First', 'display_order' => 10]));
        HeroBanner::create($this->band(['heading' => 'Second', 'display_order' => 20]));

        $this->content()
            ->assertJsonPath('hero.0.heading', 'First')
            ->assertJsonPath('hero.1.heading', 'Second')
            ->assertJsonPath('hero.2.heading', 'Third');
    }

    /**
     * The picture is announced by the band's own heading. Nothing is stored
     * beside it to say the same thing twice, so the two cannot disagree.
     */
    public function test_a_band_is_announced_by_its_heading(): void
    {
        HeroBanner::create($this->band(['heading' => 'Travel in good company']));

        $this->content()->assertJsonPath('hero.0.media_alt', 'Travel in good company');
    }

    /**
     * The words printed over the photograph.
     *
     * They used to be written into the front end, so an editor could change
     * everything about the hero except the white text a visitor reads first.
     */
    public function test_the_caption_over_the_photograph_reaches_the_page(): void
    {
        HeroBanner::create($this->band([
            'caption_label' => 'Our voyagers · out there with us',
            'caption_heading' => 'Travel together. Create stories that last.',
            'caption_text' => 'Small groups, unhurried days.',
            'caption_button_text' => 'Explore our journeys',
            'caption_button_url' => '#trips',
        ]));

        $this->content()
            ->assertJsonPath('hero.0.caption.label', 'Our voyagers · out there with us')
            ->assertJsonPath('hero.0.caption.heading', 'Travel together. Create stories that last.')
            ->assertJsonPath('hero.0.caption.button.text', 'Explore our journeys');
    }

    /** A band with none written has none, rather than an empty scrim. */
    public function test_a_band_with_no_caption_written_sends_none(): void
    {
        HeroBanner::create($this->band());

        $this->content()->assertJsonPath('hero.0.caption', null);
    }

    /** The same rule the band's own button follows: both halves, or neither. */
    public function test_a_caption_link_with_only_half_of_itself_is_not_sent(): void
    {
        HeroBanner::create($this->band([
            'caption_heading' => 'Travel together.',
            'caption_button_text' => 'Explore our journeys',
        ]));

        $this->content()
            ->assertJsonPath('hero.0.caption.heading', 'Travel together.')
            ->assertJsonPath('hero.0.caption.button', null);
    }

    /**
     * Running the business is not the public's concern: whether a band is
     * switched off, and where it sits in the order, stay on the server.
     */
    public function test_the_page_is_not_told_how_the_bands_are_managed(): void
    {
        HeroBanner::create($this->band());

        $this->content()
            ->assertJsonMissingPath('hero.0.is_active')
            ->assertJsonMissingPath('hero.0.display_order')
            ->assertJsonMissingPath('hero.0.media_path')
            ->assertJsonMissingPath('hero.0.media_disk');
    }

    /** A site with nothing stored still has a homepage. */
    public function test_an_empty_table_gives_the_page_empty_lists_rather_than_failing(): void
    {
        $this->content()
            ->assertJsonCount(0, 'hero')
            ->assertJsonCount(0, 'banners');
    }

    public function test_the_seeded_homepage_matches_the_design_it_replaces(): void
    {
        $this->seed(HeroBannerSeeder::class);

        $this->content()
            ->assertJsonCount(5, 'hero')
            ->assertJsonCount(2, 'banners')
            ->assertJsonPath('hero.0.heading', 'See the world like you *mean* it.')
            ->assertJsonPath('hero.0.label', 'Small-group travel for the 50+ explorer')
            /* Marked the same way the hero heading is: the asterisks reach the
               page as written, and the page sets what is inside them in the
               brand italic. */
            ->assertJsonPath('banners.0.heading', 'Adventure never asks *how old* you are.')
            ->assertJsonPath('banners.1.heading', 'Everything sorted, *long before* you pack.');

        // Seeding twice must not give the homepage two of everything.
        $this->seed(HeroBannerSeeder::class);
        $this->assertSame(7, HeroBanner::count());
    }
}
