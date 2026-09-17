<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\WhyUsSection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The homepage's "Why travel with us" band.
 *
 * Two rules hold this module up. The first is that there is exactly one of
 * these bands: saving twice must change the same row, because a second row
 * would be a second band competing for one fixed position on the page with
 * nothing to say which of them wins.
 *
 * The second is the bargain the homepage makes with it. A band that is not
 * worth drawing — one with no photograph — is not sent at all, and the front
 * end draws what the design shipped with instead. Half a band would be a worse
 * homepage than that fallback, not a more up-to-date one.
 *
 * What is deliberately not tested here is the band's heading and the line over
 * it, because they are not stored. They title the section rather than saying
 * anything that changes, and they live in the front end.
 */
class WhyUsSectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        WhyUsSection::forget();
    }

    private function admin(): User
    {
        return User::factory()->create();
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'points' => ['Social connection happens naturally', 'Comfortable pace'],
            'button_text' => 'See upcoming trips',
            'button_url' => '#trips',
            'image_file' => UploadedFile::fake()->image('why.jpg', 1200, 900),
            'caption_heading' => 'Small groups of 12–16',
            'caption_text' => 'Big enough for friends, small enough that everyone belongs.',
        ], $overrides);
    }

    /**
     * Saved once, so a test about changing the band starts from one that
     * exists — and so a second save is not asked for a photograph again.
     */
    private function saved(User $admin, array $overrides = []): void
    {
        $this->actingAs($admin)
            ->postJson('/api/admin/why-us', $this->payload($overrides))
            ->assertOk();

        WhyUsSection::forget();
    }

    /* --------------------------------------------------------- reaching it */

    public function test_a_signed_out_visitor_cannot_read_or_write_the_band(): void
    {
        $this->getJson('/api/admin/why-us')->assertUnauthorized();
        $this->postJson('/api/admin/why-us', $this->payload())->assertUnauthorized();
    }

    /**
     * A homepage nobody has written this band for still answers, with an empty
     * record rather than a 404 — the screen is the same screen either way, and
     * the editor is filling in blanks rather than meeting an error.
     */
    public function test_the_band_can_be_read_before_it_has_ever_been_saved(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/why-us')
            ->assertOk()
            ->assertJsonPath('data.points', [])
            ->assertJsonPath('data.image_url', null)
            ->assertJsonPath('data.updated_at', null);
    }

    /* ----------------------------------------------------------- singleton */

    public function test_saving_twice_changes_one_row_rather_than_making_two(): void
    {
        $admin = $this->admin();

        $this->saved($admin);
        $this->actingAs($admin)
            ->postJson('/api/admin/why-us', $this->payload([
                'caption_heading' => 'Rewritten.',
                'image_file' => null,
            ]))
            ->assertOk()
            ->assertJsonPath('data.caption_heading', 'Rewritten.');

        $this->assertSame(1, WhyUsSection::query()->count());
    }

    /* ---------------------------------------------------------- validation */

    /** Nothing to show is not a band. The first save has to bring a picture. */
    public function test_the_first_save_must_bring_a_photograph(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/why-us', $this->payload(['image_file' => null]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('image_file');
    }

    /**
     * And no save after it does. An editor correcting one word is not made to
     * re-upload a photograph that has not changed.
     */
    public function test_a_later_save_does_not_have_to_bring_one_again(): void
    {
        $admin = $this->admin();

        $this->saved($admin);

        $this->actingAs($admin)
            ->postJson('/api/admin/why-us', $this->payload([
                'caption_text' => 'One line changed.',
                'image_file' => null,
            ]))
            ->assertOk();
    }

    /**
     * A button with only half of itself is either a word that does nothing or a
     * destination nobody can see.
     */
    public function test_half_a_button_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/why-us', $this->payload(['button_url' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('button_url');
    }

    public function test_a_band_may_have_no_button_at_all(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/why-us', $this->payload([
                'button_text' => '', 'button_url' => '',
            ]))
            ->assertOk()
            ->assertJsonPath('data.button_text', null);
    }

    /* -------------------------------------------------------------- points */

    /**
     * A repeatable row left empty is somebody who changed their mind, not
     * somebody who made a mistake.
     */
    public function test_blank_points_are_dropped_rather_than_reported(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/why-us', $this->payload([
                'points' => ['Kept', '', '   ', 'Also kept'],
            ]))
            ->assertOk()
            ->assertJsonPath('data.points', ['Kept', 'Also kept']);
    }

    /** Past the point where the design can show them, the list is refused. */
    public function test_more_points_than_the_band_can_show_are_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/why-us', $this->payload([
                'points' => array_fill(0, 9, 'One more'),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('points');
    }

    /* --------------------------------------------------------------- files */

    public function test_a_photograph_is_stored_and_then_replaced(): void
    {
        $admin = $this->admin();

        $this->saved($admin);

        $first = WhyUsSection::query()->sole()->image_path;
        Storage::disk('public')->assertExists($first);

        $this->actingAs($admin)->postJson('/api/admin/why-us', $this->payload([
            'image_file' => UploadedFile::fake()->image('replacement.jpg', 1200, 900),
        ]))->assertOk();

        $second = WhyUsSection::query()->sole()->image_path;

        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertExists($second);
        Storage::disk('public')->assertMissing($first);
    }

    /* -------------------------------------------------------------- public */

    /**
     * Nothing written yet means nothing sent, and the front end draws what the
     * design ships with.
     */
    public function test_the_homepage_is_sent_no_band_before_one_is_written(): void
    {
        $this->getJson('/api/site/home')
            ->assertOk()
            ->assertJsonPath('why', null);
    }

    public function test_the_homepage_is_sent_the_band_once_it_is_written(): void
    {
        $this->saved($this->admin());

        $this->getJson('/api/site/home')
            ->assertOk()
            ->assertJsonPath('why.points.0', 'Social connection happens naturally')
            ->assertJsonPath('why.button.url', '#trips')
            ->assertJsonPath('why.caption.heading', 'Small groups of 12–16')
            ->assertJsonStructure(['why' => ['image' => ['url', 'alt']]]);
    }

    /**
     * A band with words but no photograph is not sent. Half a band on the
     * homepage is worse than what the design shipped with.
     */
    public function test_a_band_with_no_photograph_is_not_sent(): void
    {
        WhyUsSection::query()->create([
            'points' => ['Written, but with nothing to show.'],
        ]);
        WhyUsSection::forget();

        $this->getJson('/api/site/home')
            ->assertOk()
            ->assertJsonPath('why', null);
    }

    /** How the file is stored is the application's business, not a visitor's. */
    public function test_the_public_band_carries_nothing_about_running_the_business(): void
    {
        $this->saved($this->admin());

        $why = $this->getJson('/api/site/home')->assertOk()->json('why');

        $this->assertArrayNotHasKey('updated_at', $why);
        $this->assertArrayNotHasKey('image_path', $why);
    }
}
