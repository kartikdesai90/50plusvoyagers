<?php

namespace Tests\Feature\Site;

use App\Models\GalleryItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * What the homepage's gallery band is given, and what it is not.
 *
 * The rules an editor has to be able to trust are the ones the gallery module
 * enforces — switched off is gone, and their order is the order — and they are
 * enforced on the server for the same reason as everywhere else: the page must
 * not be in a position to disagree with the admin about either.
 *
 * The rule of its own is the cap. The homepage is not the gallery, and an
 * editor filing forty photographs must not find that the homepage has become
 * forty photographs.
 */
class HomepageGalleryTest extends TestCase
{
    use RefreshDatabase;

    /** What the homepage is handed. Named for what it is, not for its address. */
    private function content(): TestResponse
    {
        return $this->getJson('/api/site/home')->assertOk();
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

    public function test_the_homepage_is_given_its_photographs(): void
    {
        GalleryItem::create($this->photograph());

        $this->content()
            ->assertJsonCount(1, 'gallery')
            ->assertJsonPath('gallery.0.title', 'Pangong Lake, Ladakh')
            ->assertJsonPath('gallery.0.caption', 'Ancient blue water and thin mountain air.')
            ->assertJsonPath('gallery.0.image_url', '/images/home/pangong-lake.webp');
    }

    public function test_a_photograph_that_is_switched_off_does_not_reach_the_page(): void
    {
        GalleryItem::create($this->photograph(['is_active' => false]));

        $this->content()->assertJsonCount(0, 'gallery');
    }

    public function test_the_order_an_editor_set_is_the_order_the_page_receives(): void
    {
        GalleryItem::create($this->photograph(['title' => 'Third', 'display_order' => 30]));
        GalleryItem::create($this->photograph(['title' => 'First', 'display_order' => 10]));
        GalleryItem::create($this->photograph(['title' => 'Second', 'display_order' => 20]));

        $this->content()
            ->assertJsonPath('gallery.0.title', 'First')
            ->assertJsonPath('gallery.1.title', 'Second')
            ->assertJsonPath('gallery.2.title', 'Third');
    }

    public function test_the_homepage_takes_only_as_many_photographs_as_its_band_holds(): void
    {
        foreach (range(1, 12) as $number) {
            GalleryItem::create($this->photograph([
                'title' => "Photograph {$number}",
                'display_order' => $number,
            ]));
        }

        $this->content()->assertJsonCount(8, 'gallery');
    }

    /**
     * The alt text is resolved rather than stored. An editor who wrote a
     * caption has already described the picture, and storing it a second time
     * is how the two end up disagreeing.
     */
    public function test_a_photograph_is_announced_by_its_caption(): void
    {
        GalleryItem::create($this->photograph());

        $this->content()
            ->assertJsonPath('gallery.0.image_alt', 'Ancient blue water and thin mountain air.');
    }

    /** Nothing about running the business leaves the server. */
    public function test_the_page_is_not_told_how_the_gallery_is_administered(): void
    {
        GalleryItem::create($this->photograph());

        $photograph = $this->content()->json('gallery.0');

        foreach (['is_active', 'display_order', 'tour_id', 'image_path'] as $absent) {
            $this->assertArrayNotHasKey($absent, $photograph);
        }
    }
}
