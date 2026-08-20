<?php

namespace Tests\Feature\Admin;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Everything about the site that is true on every page of it.
 *
 * The rule this module rests on is that there is exactly one settings record.
 * Saving twice must change the same row, and a site nobody has configured yet
 * must still answer — because the public footer reads this on every page, and a
 * footer that had to be defensive about a missing row would be a footer with
 * two ways of being empty.
 *
 * The other rule is that the links are derived. An editor types a telephone
 * number the way their customers recognise it, and the dialable link and the
 * WhatsApp address are worked out from the digits — so however it is punctuated
 * the link still works, and nobody can paste a wa.me address that is subtly
 * pointing somewhere else.
 */
class SiteSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        SiteSetting::forget();
    }

    private function admin(): User
    {
        return User::factory()->create();
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'company_name' => '50+ Voyagers',
            'email' => 'info@50plusvoyagers.com',
            'phone' => '+91 80957 73222',
            'whatsapp_number' => '+91 (80957) 73222',
            'address' => 'HSR Layout, Bengaluru',
        ], $overrides);
    }

    /* --------------------------------------------------------- reaching it */

    public function test_a_signed_out_visitor_cannot_read_or_write_the_settings(): void
    {
        $this->getJson('/api/admin/settings')->assertUnauthorized();
        $this->postJson('/api/admin/settings', $this->payload())->assertUnauthorized();
    }

    /**
     * A site nobody has configured yet still answers, with an empty record
     * rather than a 404 — the public side reads this on every page.
     */
    public function test_the_settings_can_be_read_before_they_have_ever_been_saved(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/settings')
            ->assertOk()
            ->assertJsonPath('data.company_name', null)
            ->assertJsonPath('data.updated_at', null);
    }

    /* ---------------------------------------------------------- singleton */

    public function test_saving_twice_changes_one_row_rather_than_making_two(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/admin/settings', $this->payload())->assertOk();
        $this->actingAs($admin)
            ->postJson('/api/admin/settings', $this->payload(['company_name' => 'Renamed']))
            ->assertOk()
            ->assertJsonPath('data.company_name', 'Renamed');

        $this->assertSame(1, SiteSetting::query()->count());
    }

    /* --------------------------------------------------------- validation */

    public function test_the_site_must_have_a_name(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload(['company_name' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('company_name');
    }

    public function test_an_address_that_is_not_an_address_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload(['instagram_url' => 'instagram']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('instagram_url');
    }

    public function test_an_email_that_is_not_an_email_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload(['email' => 'not-an-address']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    /**
     * Telephone numbers are written a dozen ways, and an editor typing the one
     * their customers recognise must not be argued with.
     */
    public function test_a_telephone_number_may_be_punctuated_however_an_editor_likes(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload(['phone' => '+91 (80957) 73-222']))
            ->assertOk()
            ->assertJsonPath('data.phone_href', 'tel:+918095773222');
    }

    /* ------------------------------------------------------------ derived */

    public function test_the_whatsapp_address_is_built_from_the_number(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload())
            ->assertOk()
            ->assertJsonPath('data.whatsapp_href', 'https://wa.me/918095773222');
    }

    public function test_nothing_is_derived_from_a_number_nobody_entered(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload([
                'whatsapp_number' => '', 'phone' => '', 'email' => '',
            ]))
            ->assertOk()
            ->assertJsonPath('data.whatsapp_href', null)
            ->assertJsonPath('data.phone_href', null)
            ->assertJsonPath('data.email_href', null);
    }

    /* -------------------------------------------------------------- lists */

    /**
     * A repeatable row left half-finished is somebody who changed their mind,
     * not somebody who made a mistake.
     */
    public function test_half_finished_links_are_dropped_rather_than_reported(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload([
                'footer_links' => [
                    ['label' => 'Sitemap', 'url' => '/sitemap'],
                    ['label' => '', 'url' => 'https://example.com'],
                    ['label' => 'Nowhere', 'url' => ''],
                ],
            ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.footer_links')
            ->assertJsonPath('data.footer_links.0.label', 'Sitemap');
    }

    /* -------------------------------------------------------------- files */

    public function test_a_logo_is_stored_and_then_replaced(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/admin/settings', $this->payload([
            'logo_file' => UploadedFile::fake()->image('logo.png', 400, 120),
        ]))->assertOk();

        $first = SiteSetting::query()->sole()->logo_path;
        Storage::disk('public')->assertExists($first);

        SiteSetting::forget();

        $this->actingAs($admin)->postJson('/api/admin/settings', $this->payload([
            'logo_file' => UploadedFile::fake()->image('new-logo.png', 400, 120),
        ]))->assertOk();

        $second = SiteSetting::query()->sole()->logo_path;

        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertExists($second);
        Storage::disk('public')->assertMissing($first);
    }

    public function test_a_video_is_refused_as_a_logo(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'clip').'.mp4';
        file_put_contents(
            $path,
            hex2bin('0000001C667479706D703432000000006D70343269736F6D').str_repeat("\0", 512),
        );

        $this->actingAs($this->admin())
            ->postJson('/api/admin/settings', $this->payload([
                'logo_file' => new UploadedFile($path, 'clip.mp4', 'video/mp4', null, true),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('logo_file');
    }

    /* ------------------------------------------------------------- public */

    public function test_the_public_endpoint_answers_before_anything_is_configured(): void
    {
        $this->getJson('/api/site/settings')
            ->assertOk()
            ->assertJsonPath('company_name', null)
            ->assertJsonPath('socials', []);
    }

    /**
     * Only the profiles with an address are sent. A mark pointing nowhere is
     * worse than no mark: it looks like a working link and is not one.
     */
    public function test_the_public_endpoint_sends_only_the_profiles_that_have_an_address(): void
    {
        SiteSetting::query()->create($this->payload([
            'instagram_url' => 'https://instagram.com/50plusvoyagers',
            'linkedin_url' => null,
            'other_socials' => [['label' => 'Pinterest', 'url' => 'https://pin.it/abc']],
        ]));
        SiteSetting::forget();

        $socials = $this->getJson('/api/site/settings')->assertOk()->json('socials');

        $this->assertSame(
            ['instagram', 'whatsapp', 'link'],
            array_column($socials, 'platform'),
        );
    }

    /** The year is never stored: one written into a database is wrong each January. */
    public function test_the_copyright_line_carries_no_year(): void
    {
        SiteSetting::query()->create($this->payload([
            'copyright_text' => '50+ Voyagers. Made for the explorer at heart.',
        ]));
        SiteSetting::forget();

        $line = $this->getJson('/api/site/settings')->assertOk()->json('copyright_text');

        $this->assertSame('50+ Voyagers. Made for the explorer at heart.', $line);
        $this->assertStringNotContainsString((string) now()->year, $line);
    }
}
