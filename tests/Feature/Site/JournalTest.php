<?php

namespace Tests\Feature\Site;

use App\Enums\PostStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What a reader is given of the journal, and what they are not.
 *
 * The rule everything else rests on is what "published" means: published *and*
 * the moment has passed. A draft and a post scheduled for next week are both
 * invisible, including to anyone who knows the address — which is the half of
 * the rule a listing is most likely to remember and a single post to forget.
 *
 * The second rule is the shape. The index sends cards without their prose,
 * because sending fifteen articles to print fifteen excerpts would be most of a
 * journal down the wire to render none of it.
 */
class JournalTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, mixed> */
    private function article(array $overrides = []): array
    {
        return array_merge([
            'title' => 'A week in Ladakh',
            'slug' => 'a-week-in-ladakh',
            'excerpt' => 'Nine unhurried days at altitude.',
            'content' => "The road up is the first pleasure.\n\nThe second is the arriving.",
            'image_disk' => 'public',
            'image_path' => '/images/home/trip-ladakh.webp',
            'category' => 'Travelogue',
            'author_name' => 'Chitra Warrier',
            'status' => PostStatus::Published,
            'published_at' => now()->subDay(),
            'display_order' => 0,
        ], $overrides);
    }

    /* ---------------------------------------------------------------- index */

    public function test_the_index_is_given_every_published_article(): void
    {
        BlogPost::create($this->article());

        $this->getJson('/api/site/blog')
            ->assertOk()
            ->assertJsonCount(1, 'posts')
            ->assertJsonPath('posts.0.title', 'A week in Ladakh')
            ->assertJsonPath('posts.0.author', 'Chitra Warrier')
            ->assertJsonPath('posts.0.image_url', '/images/home/trip-ladakh.webp');
    }

    public function test_a_draft_is_not_in_the_index(): void
    {
        BlogPost::create($this->article(['status' => PostStatus::Draft]));

        $this->getJson('/api/site/blog')->assertOk()->assertJsonCount(0, 'posts');
    }

    public function test_a_post_dated_in_the_future_is_scheduled_rather_than_published(): void
    {
        BlogPost::create($this->article(['published_at' => now()->addWeek()]));

        $this->getJson('/api/site/blog')->assertOk()->assertJsonCount(0, 'posts');
    }

    /**
     * The index leads with one article at full width, so which one leads is a
     * decision — and it is the server's, arriving as the first of the list.
     */
    public function test_the_featured_article_leads_and_the_rest_follow_in_order(): void
    {
        BlogPost::create($this->article([
            'title' => 'Second', 'slug' => 'second', 'display_order' => 20,
        ]));
        BlogPost::create($this->article([
            'title' => 'First', 'slug' => 'first', 'display_order' => 10,
        ]));
        BlogPost::create($this->article([
            'title' => 'Lead', 'slug' => 'lead', 'is_featured' => true, 'display_order' => 90,
        ]));

        $this->getJson('/api/site/blog')
            ->assertOk()
            ->assertJsonPath('posts.0.title', 'Lead')
            ->assertJsonPath('posts.1.title', 'First')
            ->assertJsonPath('posts.2.title', 'Second');
    }

    /** The filter buttons, assembled from what has actually been filed. */
    public function test_the_categories_offered_are_the_ones_in_use(): void
    {
        BlogPost::create($this->article(['slug' => 'one', 'category' => 'Wellbeing']));
        BlogPost::create($this->article(['slug' => 'two', 'category' => 'Travelogue']));
        BlogPost::create($this->article(['slug' => 'three', 'category' => 'Travelogue']));
        BlogPost::create($this->article([
            'slug' => 'draft', 'category' => 'Practical', 'status' => PostStatus::Draft,
        ]));

        $this->getJson('/api/site/blog')
            ->assertOk()
            ->assertJsonPath('categories', ['Travelogue', 'Wellbeing']);
    }

    public function test_the_index_does_not_carry_the_prose_it_is_not_going_to_print(): void
    {
        BlogPost::create($this->article());

        $card = $this->getJson('/api/site/blog')->assertOk()->json('posts.0');

        $this->assertArrayNotHasKey('body', $card);
        $this->assertArrayNotHasKey('content', $card);
    }

    /* -------------------------------------------------------------- article */

    public function test_one_article_arrives_whole(): void
    {
        BlogPost::create($this->article());

        $this->getJson('/api/site/blog/a-week-in-ladakh')
            ->assertOk()
            ->assertJsonPath('post.title', 'A week in Ladakh')
            ->assertJsonPath('post.body', [
                'The road up is the first pleasure.',
                'The second is the arriving.',
            ]);
    }

    /** The page prints text, so whatever an editor pasted is resolved to text. */
    public function test_an_article_written_as_markup_arrives_as_paragraphs(): void
    {
        BlogPost::create($this->article([
            'content' => '<p>The road up is the first pleasure.</p><p>The second is the <em>arriving</em>.</p>',
        ]));

        $this->getJson('/api/site/blog/a-week-in-ladakh')
            ->assertOk()
            ->assertJsonPath('post.body', [
                'The road up is the first pleasure.',
                'The second is the arriving.',
            ]);
    }

    public function test_a_draft_cannot_be_read_by_anyone_who_knows_its_address(): void
    {
        BlogPost::create($this->article(['status' => PostStatus::Draft]));

        $this->getJson('/api/site/blog/a-week-in-ladakh')->assertNotFound();
    }

    public function test_an_address_with_nothing_at_it_is_not_found(): void
    {
        $this->getJson('/api/site/blog/nothing-was-ever-here')->assertNotFound();
    }

    /** Three cards under an article, the same category first. */
    public function test_what_to_read_next_prefers_the_same_category(): void
    {
        BlogPost::create($this->article());
        BlogPost::create($this->article([
            'title' => 'Elsewhere', 'slug' => 'elsewhere', 'category' => 'Wellbeing',
        ]));
        BlogPost::create($this->article([
            'title' => 'Another road', 'slug' => 'another-road', 'category' => 'Travelogue',
        ]));

        $response = $this->getJson('/api/site/blog/a-week-in-ladakh')->assertOk();

        $response->assertJsonCount(2, 'related')
            ->assertJsonPath('related.0.title', 'Another road')
            ->assertJsonPath('related.1.title', 'Elsewhere');
    }

    /* --------------------------------------------------------------- byline */

    public function test_the_byline_is_the_credited_writer_then_the_staff_member_then_the_club(): void
    {
        $staff = User::factory()->create(['name' => 'Meera Nair']);

        BlogPost::create($this->article([
            'slug' => 'credited', 'author_id' => $staff->id, 'author_name' => 'Chitra Warrier',
        ]));
        BlogPost::create($this->article([
            'slug' => 'filed-by-staff', 'author_id' => $staff->id, 'author_name' => null,
        ]));
        BlogPost::create($this->article(['slug' => 'neither', 'author_name' => null]));

        $this->assertSame(
            'Chitra Warrier',
            $this->getJson('/api/site/blog/credited')->json('post.author'),
        );
        $this->assertSame(
            'Meera Nair',
            $this->getJson('/api/site/blog/filed-by-staff')->json('post.author'),
        );
        $this->assertSame(
            '50+ Voyagers Team',
            $this->getJson('/api/site/blog/neither')->json('post.author'),
        );
    }

    /* ------------------------------------------------------------- homepage */

    public function test_the_homepage_row_takes_only_the_three_articles_it_shows(): void
    {
        foreach (range(1, 6) as $number) {
            BlogPost::create($this->article([
                'title' => "Article {$number}",
                'slug' => "article-{$number}",
                'display_order' => $number,
            ]));
        }

        $this->getJson('/api/site/home')
            ->assertOk()
            ->assertJsonCount(3, 'articles')
            ->assertJsonPath('articles.0.title', 'Article 1');
    }
}
