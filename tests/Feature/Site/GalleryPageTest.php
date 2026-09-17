<?php

namespace Tests\Feature\Site;

use App\Models\GalleryItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * What the gallery page is given.
 *
 * The rules it shares with the homepage band are the gallery module's own —
 * switched off is gone, and an editor's order is the order — and they hold here
 * for the same reason they hold there: the page must not be in a position to
 * disagree with the admin about either.
 *
 * The rule that differs is the cap, and it is the reason this endpoint exists.
 * The homepage takes eight because it is a band on a page about something else;
 * this is the page, so it takes all of them. A test for that is a test that the
 * two have not quietly become one query with one limit.
 */
class GalleryPageTest extends TestCase
{
    use RefreshDatabase;

    /** What the gallery page is handed. */
    private function content(): TestResponse
    {
        return $this->getJson('/api/site/gallery')->assertOk();
    }

    /** @return array<string, mixed> */
    private function photograph(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Pangong Lake, Ladakh',
            'caption' => 'Ancient blue water and thin mountain air.',
            'image_path' => '/images/home/pangong-lake.webp',
            'is_active' => true,
            'display_order' => 0,
        ], $overrides);
    }

    public function test_the_page_is_given_its_photographs(): void
    {
        GalleryItem::create($this->photograph());

        $this->content()
            ->assertJsonCount(1, 'photos')
            ->assertJsonPath('photos.0.title', 'Pangong Lake, Ladakh')
            ->assertJsonPath('photos.0.caption', 'Ancient blue water and thin mountain air.')
            ->assertJsonPath('photos.0.image_url', '/images/home/pangong-lake.webp');
    }

    public function test_a_photograph_that_is_switched_off_does_not_reach_the_page(): void
    {
        GalleryItem::create($this->photograph(['is_active' => false]));

        $this->content()->assertJsonCount(0, 'photos');
    }

    public function test_the_order_an_editor_set_is_the_order_the_page_receives(): void
    {
        GalleryItem::create($this->photograph(['title' => 'Third', 'display_order' => 30]));
        GalleryItem::create($this->photograph(['title' => 'First', 'display_order' => 10]));
        GalleryItem::create($this->photograph(['title' => 'Second', 'display_order' => 20]));

        $this->content()
            ->assertJsonPath('photos.0.title', 'First')
            ->assertJsonPath('photos.1.title', 'Second')
            ->assertJsonPath('photos.2.title', 'Third');
    }

    /**
     * The whole point of this endpoint. The homepage stops at eight; a visitor
     * who followed "see every photograph" is owed every photograph.
     */
    public function test_the_page_is_given_every_photograph_rather_than_the_homepage_s_eight(): void
    {
        foreach (range(1, 12) as $number) {
            GalleryItem::create($this->photograph([
                'title' => "Photograph {$number}",
                'display_order' => $number,
            ]));
        }

        $this->content()->assertJsonCount(12, 'photos');
    }

    /** Nothing about running the business leaves the server. */
    public function test_the_page_is_not_told_how_the_gallery_is_administered(): void
    {
        GalleryItem::create($this->photograph());

        $photograph = $this->content()->json('photos.0');

        foreach (['is_active', 'display_order', 'tour_id', 'image_path'] as $absent) {
            $this->assertArrayNotHasKey($absent, $photograph);
        }
    }
}
