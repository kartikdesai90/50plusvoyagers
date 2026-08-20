<?php

namespace Tests\Feature\Admin;

use App\Models\HeroBanner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The homepage's hero slides and banner bands, from the admin's side.
 *
 * The four combinations the module exists to support — hero or banner, picture
 * or film — are each written end to end, because the interesting failures are
 * at the seam where the file meets the record: anything that is not a picture
 * passes every generic upload rule and then fails silently on the page.
 */
class HeroBannerManagementTest extends TestCase
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

    private function picture(string $name = 'band.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1600, 900);
    }

    /**
     * A file the validator will read as a real video.
     *
     * `fake()->create()` writes an empty file, and an empty file has no
     * detectable type — so the bytes matter here even though nothing plays them.
     */
    private function video(string $name = 'band.mp4'): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'band').'.mp4';

        // A minimal MP4 container header: enough for the type to be read from
        // the content rather than from the file's name.
        file_put_contents($path, hex2bin('0000001C667479706D703432000000006D70343269736F6D').str_repeat("\0", 1024));

        return new UploadedFile($path, $name, 'video/mp4', null, true);
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'section_type' => 'hero',
            'label' => 'Small-group travel for the 50+ explorer',
            'heading' => 'See the world like you *mean* it.',
            'description' => 'Thoughtfully paced journeys for people just getting started.',
            'button_text' => 'Browse the trip calendar',
            'button_url' => '#trips',
            'is_active' => true,
            'display_order' => 0,
        ], $overrides);
    }

    public function test_a_signed_out_visitor_cannot_reach_the_bands(): void
    {
        $this->getJson('/api/admin/hero-banners')->assertUnauthorized();
    }

    /* ---------------------------------------------------- the four combinations */

    public function test_a_hero_band_is_created_with_a_picture(): void
    {
        $response = $this->actingAs($this->admin())
            ->post('/api/admin/hero-banners', $this->payload([
                'media_file' => $this->picture(),
            ]))
            ->assertCreated()
            ->assertJsonPath('data.section_type', 'hero');

        $band = HeroBanner::firstOrFail();
        $this->assertTrue($band->hasUploadedFile());
        Storage::disk('public')->assertExists($band->media_path);
        $this->assertStringContainsString('/storage/', $response->json('data.media_url'));
    }

    public function test_a_banner_band_is_created_with_a_picture(): void
    {
        $this->actingAs($this->admin())
            ->post('/api/admin/hero-banners', $this->payload([
                'section_type' => 'banner',
                'heading' => 'Adventure never asks how old you are.',
                'media_file' => $this->picture(),
            ]))
            ->assertCreated()
            ->assertJsonPath('data.section_type', 'banner');
    }

    /* ------------------------------------------------------------- the file itself */

    /** A band shows a picture; a film is no longer one of the things it can be. */
    public function test_a_video_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/hero-banners', $this->payload([
                'media_file' => $this->video(),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('media_file');

        $this->assertSame(0, HeroBanner::count());
    }

    /**
     * A file's name is a claim; its content is the evidence.
     *
     * Written with a real file rather than a fake one on purpose: the fake
     * reports whatever type its name implies, so it would agree with the lie
     * and the check would pass without proving anything.
     */
    public function test_a_file_pretending_to_be_a_picture_is_refused(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'band').'.jpg';
        file_put_contents($path, 'not a picture at all, whatever the name says');

        $disguised = new UploadedFile($path, 'band.jpg', 'image/jpeg', null, true);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/hero-banners', $this->payload(['media_file' => $disguised]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('media_file');
    }

    public function test_a_band_cannot_be_created_without_a_file(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/hero-banners', $this->payload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('media_file');
    }

    /* -------------------------------------------------------------- the words */

    public function test_half_a_button_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/hero-banners', $this->payload([
                'button_text' => 'Browse the trip calendar',
                'button_url' => '',
                'media_file' => $this->picture(),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('button_url');
    }

    public function test_a_heading_is_required(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/hero-banners', $this->payload([
                'heading' => '',
                'media_file' => $this->picture(),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('heading');
    }

    /* ------------------------------------------------------ reading and changing */

    public function test_the_bands_are_listed_with_what_the_form_may_choose_from(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/api/admin/hero-banners', $this->payload([
            'media_file' => $this->picture(),
        ]))->assertCreated();

        $this->actingAs($admin)
            ->getJson('/api/admin/hero-banners')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonCount(2, 'meta.sections')
            ->assertJsonCount(2, 'meta.sections');
    }

    public function test_the_words_are_changed_without_touching_the_file(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/hero-banners', $this->payload([
            'media_file' => $this->picture(),
        ]))->assertCreated()->json('data');

        $originalPath = HeroBanner::firstOrFail()->media_path;

        $this->actingAs($admin)
            ->post("/api/admin/hero-banners/{$created['id']}", $this->payload([
                'heading' => 'A different heading entirely.',
            ]))
            ->assertOk()
            ->assertJsonPath('data.heading', 'A different heading entirely.');

        $this->assertSame($originalPath, HeroBanner::firstOrFail()->media_path);
        Storage::disk('public')->assertExists($originalPath);
    }

    /** The file that nothing points at any more goes with it. */
    public function test_replacing_the_file_removes_the_one_it_replaced(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/hero-banners', $this->payload([
            'media_file' => $this->picture('first.jpg'),
        ]))->assertCreated()->json('data');

        $firstPath = HeroBanner::firstOrFail()->media_path;

        $this->actingAs($admin)
            ->post("/api/admin/hero-banners/{$created['id']}", $this->payload([
                'media_file' => $this->picture('second.jpg'),
            ]))
            ->assertOk();

        $secondPath = HeroBanner::firstOrFail()->media_path;

        $this->assertNotSame($firstPath, $secondPath);
        Storage::disk('public')->assertExists($secondPath);
        Storage::disk('public')->assertMissing($firstPath);
    }

    public function test_a_band_is_removed_along_with_its_file(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/hero-banners', $this->payload([
            'media_file' => $this->picture(),
        ]))->assertCreated()->json('data');

        $path = HeroBanner::firstOrFail()->media_path;

        $this->actingAs($admin)
            ->deleteJson("/api/admin/hero-banners/{$created['id']}")
            ->assertNoContent();

        $this->assertSame(0, HeroBanner::count());
        Storage::disk('public')->assertMissing($path);
    }

    /**
     * The pictures that ship with the design are referenced, not uploaded.
     * Removing a band must not reach into the public directory and delete one.
     */
    public function test_removing_a_band_leaves_a_file_it_did_not_upload(): void
    {
        $band = HeroBanner::create($this->payload([
            'media_path' => '/images/home/hero-mountain-lake.webp',
        ]));

        $this->actingAs($this->admin())
            ->deleteJson("/api/admin/hero-banners/{$band->id}")
            ->assertNoContent();

        $this->assertFileExists(public_path('images/home/hero-mountain-lake.webp'));
    }
}
