<?php

namespace Tests\Feature\Admin;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The journal, from the admin's side.
 *
 * The interesting cases are the ones where a post is not merely saved but
 * published: an address that has to stay unique because it is where the post
 * lives, a publish moment that decides whether "published" means readable yet,
 * and the refusal to put an empty page on the internet with our name on it.
 */
class BlogManagementTest extends TestCase
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

    private function picture(string $name = 'cover.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1600, 900);
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'A week in Ladakh',
            'excerpt' => 'What nine unhurried days at altitude actually feel like.',
            'content' => 'The road out of Leh climbs slowly, which is the point.',
            'category' => 'Destinations',
            'tags' => ['Ladakh', 'Himalaya'],
            'status' => 'draft',
            'is_featured' => false,
            'display_order' => 0,
        ], $overrides);
    }

    public function test_a_signed_out_visitor_cannot_reach_the_journal(): void
    {
        $this->getJson('/api/admin/blog')->assertUnauthorized();
    }

    /* -------------------------------------------------------------- writing */

    public function test_a_post_is_created_and_its_address_is_written_from_its_title(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.slug', 'a-week-in-ladakh')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.public_path', '/blog/a-week-in-ladakh')
            ->assertJsonPath('data.tags', ['Ladakh', 'Himalaya']);
    }

    public function test_a_second_post_with_the_same_title_gets_an_address_of_its_own(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/admin/blog', $this->payload())->assertCreated();

        $this->actingAs($admin)
            ->postJson('/api/admin/blog', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.slug', 'a-week-in-ladakh-2');
    }

    /** An address an editor typed is never quietly changed — they are told. */
    public function test_an_address_already_in_use_is_refused_in_plain_words(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->postJson('/api/admin/blog', $this->payload())->assertCreated();

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/blog', $this->payload([
                'title' => 'Another Ladakh piece',
                'slug' => 'a-week-in-ladakh',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('slug');

        $this->assertStringContainsString('Another post already lives', $response->json('errors.slug.0'));
    }

    public function test_an_address_with_spaces_in_it_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload(['slug' => 'A Week In Ladakh']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('slug');
    }

    public function test_a_title_is_required(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload(['title' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('title');
    }

    /* ----------------------------------------------------------- publishing */

    public function test_an_empty_post_cannot_be_published(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload([
                'content' => '',
                'status' => 'published',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('content');

        $this->assertSame(0, BlogPost::count());
    }

    public function test_publishing_records_the_moment_it_happened(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload(['status' => 'published']))
            ->assertCreated()
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.is_live', true)
            ->assertJsonPath('data.status_label', 'Published');

        $this->assertNotNull(BlogPost::firstOrFail()->published_at);
    }

    /** A date in the future is a post scheduled to appear, not one that is out. */
    public function test_a_post_dated_ahead_is_scheduled_rather_than_live(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload([
                'status' => 'published',
                'published_at' => now()->addWeek()->toDateTimeString(),
            ]))
            ->assertCreated()
            ->assertJsonPath('data.is_live', false)
            ->assertJsonPath('data.status_label', 'Scheduled');
    }

    public function test_reading_time_is_worked_out_rather_than_typed(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload([
                'content' => str_repeat('word ', 800),
            ]))
            ->assertCreated()
            ->assertJsonPath('data.reading_minutes', 4);
    }

    /* --------------------------------------------------------- the trimmings */

    public function test_a_featured_image_is_stored_and_replaced(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/blog', $this->payload([
            'image_file' => $this->picture('first.jpg'),
        ]))->assertCreated()->json('data');

        $first = BlogPost::firstOrFail()->image_path;
        Storage::disk('public')->assertExists($first);

        $this->actingAs($admin)
            ->post("/api/admin/blog/{$created['id']}", $this->payload([
                'slug' => $created['slug'],
                'image_file' => $this->picture('second.jpg'),
            ]))
            ->assertOk();

        $second = BlogPost::firstOrFail()->image_path;

        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertMissing($first);
    }

    public function test_a_video_is_refused_as_a_featured_image(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'clip').'.mp4';
        file_put_contents($path, hex2bin('0000001C667479706D703432000000006D70343269736F6D').str_repeat("\0", 512));

        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload([
                'image_file' => new UploadedFile($path, 'clip.mp4', 'video/mp4', null, true),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('image_file');
    }

    public function test_the_staff_member_who_filed_a_post_is_recorded_and_named(): void
    {
        $author = User::factory()->create(['name' => 'Meera Nair']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload(['author_id' => $author->id]))
            ->assertCreated()
            ->assertJsonPath('data.author_id', $author->id)
            ->assertJsonPath('data.staff_name', 'Meera Nair');
    }

    /**
     * The byline is a name rather than an account, because most of this journal
     * is written by members of the club and a member has no account here.
     */
    public function test_a_credited_writer_becomes_the_byline(): void
    {
        $filedBy = User::factory()->create(['name' => 'Meera Nair']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload([
                'author_id' => $filedBy->id,
                'author_name' => 'Chitra Warrier',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.author_name', 'Chitra Warrier')
            ->assertJsonPath('data.byline', 'Chitra Warrier');
    }

    /** With nobody credited, the staff member who filed it takes the byline. */
    public function test_the_byline_falls_back_to_the_staff_member_and_then_to_the_club(): void
    {
        $filedBy = User::factory()->create(['name' => 'Meera Nair']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload(['author_id' => $filedBy->id]))
            ->assertCreated()
            ->assertJsonPath('data.byline', 'Meera Nair');

        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload(['title' => 'A week in Sikkim']))
            ->assertCreated()
            ->assertJsonPath('data.byline', '50+ Voyagers Team');
    }

    public function test_the_seo_block_is_stored(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload([
                'meta_title' => 'A week in Ladakh | 50+ Voyagers',
                'meta_description' => 'Nine unhurried days at altitude, described honestly.',
                'canonical_url' => 'https://50plusvoyagers.com/journal/a-week-in-ladakh',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.meta_title', 'A week in Ladakh | 50+ Voyagers')
            ->assertJsonPath('data.canonical_url', 'https://50plusvoyagers.com/journal/a-week-in-ladakh');
    }

    public function test_a_canonical_address_that_is_not_an_address_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/blog', $this->payload(['canonical_url' => 'not a url']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('canonical_url');
    }

    /* --------------------------------------------------- reading the journal */

    public function test_the_list_is_searched_and_filtered(): void
    {
        $admin = $this->admin();

        BlogPost::create($this->payload([
            'title' => 'A week in Ladakh',
            'slug' => 'a-week-in-ladakh',
            'status' => 'published',
            'published_at' => now()->subWeek(),
            'category' => 'Destinations',
            'is_featured' => true,
        ]));
        BlogPost::create($this->payload([
            'title' => 'Packing for altitude',
            'slug' => 'packing-for-altitude',
            'status' => 'draft',
            'category' => 'Advice',
        ]));

        $this->actingAs($admin)->getJson('/api/admin/blog')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonCount(2, 'meta.statuses')
            ->assertJsonCount(2, 'meta.categories');

        $this->actingAs($admin)->getJson('/api/admin/blog?status=draft')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Packing for altitude');

        $this->actingAs($admin)->getJson('/api/admin/blog?category=Advice')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Packing for altitude');

        $this->actingAs($admin)->getJson('/api/admin/blog?featured=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'A week in Ladakh');

        $this->actingAs($admin)->getJson('/api/admin/blog?search=packing')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Packing for altitude');
    }

    public function test_the_list_is_filtered_by_date(): void
    {
        $admin = $this->admin();

        BlogPost::create($this->payload([
            'title' => 'Old news',
            'slug' => 'old-news',
            'status' => 'published',
            'published_at' => now()->subMonths(6),
        ]));
        BlogPost::create($this->payload([
            'title' => 'This week',
            'slug' => 'this-week',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]));

        $this->actingAs($admin)
            ->getJson('/api/admin/blog?from='.now()->subWeek()->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'This week');

        $this->actingAs($admin)
            ->getJson('/api/admin/blog?to='.now()->subMonth()->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Old news');
    }

    public function test_a_post_is_read_back_whole_for_the_form(): void
    {
        $post = BlogPost::create($this->payload([
            'slug' => 'a-week-in-ladakh',
            'tags' => ['Ladakh'],
        ]));

        $this->actingAs($this->admin())
            ->getJson("/api/admin/blog/{$post->id}")
            ->assertOk()
            ->assertJsonPath('data.slug', 'a-week-in-ladakh')
            ->assertJsonPath('data.category', 'Destinations')
            ->assertJsonPath('data.tags', ['Ladakh']);
    }

    public function test_a_post_is_removed_along_with_its_picture(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/blog', $this->payload([
            'image_file' => $this->picture(),
        ]))->assertCreated()->json('data');

        $path = BlogPost::firstOrFail()->image_path;

        $this->actingAs($admin)
            ->deleteJson("/api/admin/blog/{$created['id']}")
            ->assertNoContent();

        $this->assertSame(0, BlogPost::count());
        Storage::disk('public')->assertMissing($path);
    }
}
