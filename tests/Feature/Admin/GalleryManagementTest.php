<?php

namespace Tests\Feature\Admin;

use App\Models\GalleryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Photographs from the road, from the admin's side.
 *
 * The gallery is pictures only, so the case that matters most is the one where
 * something else is offered: a film accepted here would be a film the gallery
 * has no way to play.
 */
class GalleryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    private function admin(): User
    {
        return User::factory()->create();
    }

    private function picture(string $name = 'pangong.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1600, 1200);
    }

    private function video(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'clip').'.mp4';
        file_put_contents(
            $path,
            hex2bin('0000001C667479706D703432000000006D70343269736F6D').str_repeat("\0", 512),
        );

        return new UploadedFile($path, 'clip.mp4', 'video/mp4', null, true);
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Morning on Pangong',
            'caption' => 'The lake changing colour as the sun came over the ridge.',
            'is_featured' => false,
            'is_active' => true,
            'display_order' => 0,
        ], $overrides);
    }

    public function test_a_signed_out_visitor_cannot_reach_the_gallery(): void
    {
        $this->getJson('/api/admin/gallery')->assertUnauthorized();
    }

    public function test_a_photograph_is_added(): void
    {
        $response = $this->actingAs($this->admin())
            ->post('/api/admin/gallery', $this->payload(['image_file' => $this->picture()]))
            ->assertCreated()
            ->assertJsonPath('data.title', 'Morning on Pangong');

        $item = GalleryItem::firstOrFail();
        Storage::disk('public')->assertExists($item->image_path);
        $this->assertStringContainsString('/storage/', $response->json('data.image_url'));
    }

    public function test_a_photograph_is_required(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/gallery', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('image_file');
    }

    /** The gallery is photographs. A film has a home elsewhere. */
    public function test_a_video_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/gallery', $this->payload(['image_file' => $this->video()]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('image_file');

        $this->assertSame(0, GalleryItem::count());
    }

    public function test_a_title_is_required(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/gallery', $this->payload([
                'title' => '',
                'image_file' => $this->picture(),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('title');
    }

    /**
     * An editor who wrote a caption has already described the picture; storing
     * it a second time is how the two end up disagreeing.
     */
    public function test_a_picture_is_announced_by_its_caption(): void
    {
        $this->actingAs($this->admin())
            ->post('/api/admin/gallery', $this->payload([
                'image_file' => $this->picture(),
            ]))
            ->assertCreated()
            ->assertJsonPath(
                'data.described_as',
                'The lake changing colour as the sun came over the ridge.',
            );
    }

    public function test_the_list_is_searched_and_filtered(): void
    {
        $admin = $this->admin();

        GalleryItem::create($this->payload([
            'title' => 'Morning on Pangong',
            'image_path' => 'gallery/one.jpg',
        ]));
        GalleryItem::create($this->payload([
            'title' => 'Evening in Leh',
            'image_path' => 'gallery/two.jpg',
            'is_active' => false,
        ]));
        GalleryItem::create($this->payload([
            'title' => 'Kerala backwaters',
            'image_path' => 'gallery/three.jpg',
            'tour_id' => 4,
            'is_featured' => true,
        ]));

        $this->actingAs($admin)->getJson('/api/admin/gallery')
            ->assertOk()
            ->assertJsonPath('meta.total', 3);

        $this->actingAs($admin)->getJson('/api/admin/gallery?search=pangong')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Morning on Pangong');

        $this->actingAs($admin)->getJson('/api/admin/gallery?status=inactive')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Evening in Leh');

        $this->actingAs($admin)->getJson('/api/admin/gallery?tour_id=4')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Kerala backwaters');

        $this->actingAs($admin)->getJson('/api/admin/gallery?featured=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Kerala backwaters');
    }

    public function test_the_order_an_editor_set_is_the_order_the_list_gets(): void
    {
        $admin = $this->admin();
        GalleryItem::create($this->payload(['title' => 'Third', 'image_path' => 'a.jpg', 'display_order' => 30]));
        GalleryItem::create($this->payload(['title' => 'First', 'image_path' => 'b.jpg', 'display_order' => 10]));
        GalleryItem::create($this->payload(['title' => 'Second', 'image_path' => 'c.jpg', 'display_order' => 20]));

        $this->actingAs($admin)->getJson('/api/admin/gallery')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'First')
            ->assertJsonPath('data.1.title', 'Second')
            ->assertJsonPath('data.2.title', 'Third');
    }

    public function test_the_caption_is_changed_without_touching_the_picture(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/gallery', $this->payload([
            'image_file' => $this->picture(),
        ]))->assertCreated()->json('data');

        $original = GalleryItem::firstOrFail()->image_path;

        $this->actingAs($admin)
            ->post("/api/admin/gallery/{$created['id']}", $this->payload([
                'caption' => 'A different caption entirely.',
            ]))
            ->assertOk()
            ->assertJsonPath('data.caption', 'A different caption entirely.');

        $this->assertSame($original, GalleryItem::firstOrFail()->image_path);
        Storage::disk('public')->assertExists($original);
    }

    public function test_replacing_the_picture_removes_the_one_it_replaced(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/gallery', $this->payload([
            'image_file' => $this->picture('first.jpg'),
        ]))->assertCreated()->json('data');

        $first = GalleryItem::firstOrFail()->image_path;

        $this->actingAs($admin)
            ->post("/api/admin/gallery/{$created['id']}", $this->payload([
                'image_file' => $this->picture('second.jpg'),
            ]))
            ->assertOk();

        $second = GalleryItem::firstOrFail()->image_path;

        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertExists($second);
        Storage::disk('public')->assertMissing($first);
    }

    public function test_the_status_and_featured_switches_are_flipped(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/gallery', $this->payload([
            'image_file' => $this->picture(),
        ]))->assertCreated()->json('data');

        $this->actingAs($admin)
            ->post("/api/admin/gallery/{$created['id']}", $this->payload([
                'is_active' => false,
                'is_featured' => true,
            ]))
            ->assertOk()
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.is_featured', true);
    }

    public function test_a_photograph_is_removed_along_with_its_file(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/gallery', $this->payload([
            'image_file' => $this->picture(),
        ]))->assertCreated()->json('data');

        $path = GalleryItem::firstOrFail()->image_path;

        $this->actingAs($admin)
            ->deleteJson("/api/admin/gallery/{$created['id']}")
            ->assertNoContent();

        $this->assertSame(0, GalleryItem::count());
        Storage::disk('public')->assertMissing($path);
    }
}
