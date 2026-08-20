<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\WhoWeAreCard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The four "Who we are" cards on the homepage.
 *
 * The rule this module rests on is that a save is a save of the whole set. What
 * arrives is what the band becomes: a card with an id is changed, one without
 * is added, and one that does not arrive is taken off the page. That is what
 * lets an editor reorder and remove cards on one screen without a second
 * endpoint and without a field to type a position into — a card's place in the
 * payload is its place on the homepage.
 *
 * The section's own heading and the line over it are not tested because they
 * are not stored. They title the section rather than saying anything that
 * changes, and they live in the front end.
 */
class WhoWeAreCardsTest extends TestCase
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

    /** One card as the form sends it, picture included. */
    private function card(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Small groups',
            'body' => '12–16 fellow travellers, never a faceless crowd.',
            'image_file' => UploadedFile::fake()->image('card.jpg', 900, 600),
            'is_active' => 'true',
        ], $overrides);
    }

    /** A card that is already on the page, kept as it is. */
    private function keep(WhoWeAreCard $card, array $overrides = []): array
    {
        return array_merge([
            'id' => $card->id,
            'title' => $card->title,
            'body' => $card->body,
            'is_active' => 'true',
        ], $overrides);
    }

    /** Saves a set and hands back the cards as they were stored. */
    private function save(User $admin, array $cards): void
    {
        $this->actingAs($admin)
            ->postJson('/api/admin/who-we-are', ['cards' => $cards])
            ->assertOk();
    }

    /* --------------------------------------------------------- reaching it */

    public function test_a_signed_out_visitor_cannot_read_or_write_the_cards(): void
    {
        $this->getJson('/api/admin/who-we-are')->assertUnauthorized();
        $this->postJson('/api/admin/who-we-are', ['cards' => [$this->card()]])
            ->assertUnauthorized();
    }

    /** A homepage nobody has written cards for answers with an empty set. */
    public function test_the_cards_can_be_read_before_any_are_written(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/who-we-are')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    /* ------------------------------------------------------------- the set */

    public function test_cards_are_written_in_the_order_they_arrive(): void
    {
        $this->save($this->admin(), [
            $this->card(['title' => 'First']),
            $this->card(['title' => 'Second']),
            $this->card(['title' => 'Third']),
        ]);

        $this->assertSame(
            ['First', 'Second', 'Third'],
            WhoWeAreCard::query()->orderBy('display_order')->pluck('title')->all(),
        );
    }

    /**
     * Reordering is moving them in the payload. Nobody types a number, so
     * nobody can type one that contradicts what they can see.
     */
    public function test_reordering_the_payload_reorders_the_band(): void
    {
        $admin = $this->admin();

        $this->save($admin, [
            $this->card(['title' => 'First']),
            $this->card(['title' => 'Second']),
        ]);

        [$first, $second] = WhoWeAreCard::query()->orderBy('display_order')->get()->all();

        $this->save($admin, [$this->keep($second), $this->keep($first)]);

        $this->assertSame(
            ['Second', 'First'],
            WhoWeAreCard::query()->orderBy('display_order')->pluck('title')->all(),
        );
    }

    /** A card left out of the payload is a card taken off the page. */
    public function test_a_card_left_out_of_the_save_is_removed(): void
    {
        $admin = $this->admin();

        $this->save($admin, [
            $this->card(['title' => 'Kept']),
            $this->card(['title' => 'Dropped']),
        ]);

        $kept = WhoWeAreCard::query()->where('title', 'Kept')->sole();
        $dropped = WhoWeAreCard::query()->where('title', 'Dropped')->sole();
        $orphan = $dropped->image_path;

        $this->save($admin, [$this->keep($kept)]);

        $this->assertSame(1, WhoWeAreCard::query()->count());
        $this->assertDatabaseMissing('who_we_are_cards', ['id' => $dropped->id]);
        /* And its picture goes with it, rather than being left on the disk. */
        Storage::disk('public')->assertMissing($orphan);
    }

    /** A card that arrives with no id is a new one. */
    public function test_a_card_with_no_id_is_added_beside_the_others(): void
    {
        $admin = $this->admin();

        $this->save($admin, [$this->card(['title' => 'First'])]);
        $first = WhoWeAreCard::query()->sole();

        $this->save($admin, [$this->keep($first), $this->card(['title' => 'Added'])]);

        $this->assertSame(
            ['First', 'Added'],
            WhoWeAreCard::query()->orderBy('display_order')->pluck('title')->all(),
        );
    }

    /**
     * A card keeps the picture it has unless one is sent to replace it, so a
     * save that only changes words does not lose the photographs.
     */
    public function test_a_card_keeps_its_picture_when_the_save_brings_none(): void
    {
        $admin = $this->admin();

        $this->save($admin, [$this->card()]);
        $stored = WhoWeAreCard::query()->sole();

        $this->save($admin, [$this->keep($stored, ['title' => 'Renamed'])]);

        $after = WhoWeAreCard::query()->sole();

        $this->assertSame('Renamed', $after->title);
        $this->assertSame($stored->image_path, $after->image_path);
        Storage::disk('public')->assertExists($after->image_path);
    }

    public function test_a_replacement_picture_removes_the_one_it_replaced(): void
    {
        $admin = $this->admin();

        $this->save($admin, [$this->card()]);
        $stored = WhoWeAreCard::query()->sole();

        $this->save($admin, [$this->keep($stored, [
            'image_file' => UploadedFile::fake()->image('replacement.jpg', 900, 600),
        ])]);

        $after = WhoWeAreCard::query()->sole();

        $this->assertNotSame($stored->image_path, $after->image_path);
        Storage::disk('public')->assertExists($after->image_path);
        Storage::disk('public')->assertMissing($stored->image_path);
    }

    /* ---------------------------------------------------------- validation */

    public function test_every_card_needs_a_title(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/who-we-are', ['cards' => [$this->card(['title' => ''])]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('cards.0.title');
    }

    /** A card is a picture with words under it. A new one has to bring one. */
    public function test_a_new_card_must_bring_a_picture(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/who-we-are', ['cards' => [$this->card(['image_file' => null])]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('cards.0.image_file');
    }

    /** An empty band is a mistake rather than a choice. */
    public function test_the_band_cannot_be_emptied(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/who-we-are', ['cards' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('cards');
    }

    /** Nothing is written when one card in the set is wrong. */
    public function test_a_refused_save_changes_nothing(): void
    {
        $admin = $this->admin();

        $this->save($admin, [$this->card(['title' => 'Only'])]);
        $stored = WhoWeAreCard::query()->sole();

        $this->actingAs($admin)
            ->postJson('/api/admin/who-we-are', ['cards' => [
                $this->keep($stored, ['title' => 'Changed']),
                $this->card(['title' => '']),
            ]])
            ->assertStatus(422);

        $this->assertSame('Only', WhoWeAreCard::query()->sole()->title);
    }

    /* -------------------------------------------------------------- public */

    public function test_the_homepage_is_sent_no_cards_before_any_are_written(): void
    {
        $this->getJson('/api/site/home')
            ->assertOk()
            ->assertJsonPath('values', []);
    }

    /** Switched off is off everywhere at once. */
    public function test_a_card_that_is_switched_off_is_not_sent(): void
    {
        $admin = $this->admin();

        $this->save($admin, [
            $this->card(['title' => 'Shown']),
            $this->card(['title' => 'Hidden', 'is_active' => 'false']),
        ]);

        $values = $this->getJson('/api/site/home')->assertOk()->json('values');

        $this->assertSame(['Shown'], array_column($values, 'title'));
    }

    /**
     * A card's picture is announced by the card's own title. Nothing is stored
     * beside it to say the same thing twice.
     */
    public function test_a_card_is_announced_by_its_title(): void
    {
        $this->save($this->admin(), [$this->card()]);

        $values = $this->getJson('/api/site/home')->assertOk()->json('values');

        $this->assertSame('Small groups', $values[0]['image_alt']);
    }

    /** Whether it is switched off is not a question a visitor's copy answers. */
    public function test_the_public_cards_carry_nothing_about_running_the_business(): void
    {
        $this->save($this->admin(), [$this->card()]);

        $values = $this->getJson('/api/site/home')->assertOk()->json('values');

        $this->assertArrayNotHasKey('is_active', $values[0]);
        $this->assertArrayNotHasKey('display_order', $values[0]);
        $this->assertArrayNotHasKey('image_path', $values[0]);
    }
}
