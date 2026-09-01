<?php

namespace Tests\Feature\Admin;

use App\Models\Tour;
use App\Models\User;
use App\Support\TourChoices;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The group tours an editor maintains.
 *
 * Five fields, matching the client's CRM table. What is worth testing is not
 * that Eloquent saves a row, but the handful of rules that would otherwise be
 * rediscovered by whoever hits them: a tour code identifies exactly one tour, a
 * padded code is the same code, an undated tour does not jump the queue, and a
 * search finds a name whatever case it was typed in.
 */
class TourManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create();
    }

    public function test_the_tours_api_refuses_an_anonymous_request(): void
    {
        $this->getJson('/api/admin/tours')->assertUnauthorized();
    }

    public function test_an_editor_creates_a_tour(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours', [
                'tour_code' => 'Coorg30052026',
                'tour_name' => 'Coorg 30 May - 2 June 2026',
                'end_date' => '2026-06-02',
            ])
            ->assertCreated()
            ->assertJsonPath('data.tour_code', 'Coorg30052026')
            ->assertJsonPath('data.tour_name', 'Coorg 30 May - 2 June 2026')
            ->assertJsonPath('data.end_date', '2026-06-02');

        $this->assertDatabaseHas('tours', ['tour_code' => 'Coorg30052026']);
    }

    /**
     * The CRM's own data has a code with a leading space
     * (`' Kinnaur06062026'`). A space is invisible in a form field, so it is
     * removed before anything is checked — otherwise two codes that read alike
     * are two different rows.
     */
    public function test_a_padded_tour_code_is_trimmed_before_it_is_stored(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours', [
                'tour_code' => '  Kinnaur06062026  ',
                'tour_name' => '  Kinnaur 6 - 14 June 2026  ',
            ])
            ->assertCreated()
            ->assertJsonPath('data.tour_code', 'Kinnaur06062026')
            ->assertJsonPath('data.tour_name', 'Kinnaur 6 - 14 June 2026');
    }

    /** And the trim happens early enough that it catches a duplicate. */
    public function test_a_padded_code_collides_with_the_same_code_already_stored(): void
    {
        Tour::create(['tour_code' => 'Jog07072026', 'tour_name' => 'Jog Waterfall']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours', [
                'tour_code' => '   Jog07072026',
                'tour_name' => 'Jog again',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tour_code');
    }

    public function test_a_tour_code_is_unique(): void
    {
        Tour::create(['tour_code' => 'EUR-2026-001', 'tour_name' => 'European Highlights 2026']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours', [
                'tour_code' => 'EUR-2026-001',
                'tour_name' => 'Something else',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tour_code');
    }

    public function test_a_tour_keeps_its_own_code_when_it_is_edited(): void
    {
        $tour = Tour::create(['tour_code' => 'Bali02092026', 'tour_name' => 'Bali']);

        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours/'.$tour->id, [
                'tour_code' => 'Bali02092026',
                'tour_name' => 'Bali 2 - 7 September 2026',
                'end_date' => '2026-09-07',
            ])
            ->assertOk()
            ->assertJsonPath('data.tour_name', 'Bali 2 - 7 September 2026')
            ->assertJsonPath('data.end_date', '2026-09-07');
    }

    public function test_a_code_and_a_name_are_required(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['tour_code', 'tour_name']);
    }

    /** The CRM has it nullable, so a tour can be recorded before it is settled. */
    public function test_a_tour_may_have_no_end_date(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours', [
                'tour_code' => 'Japan18112026',
                'tour_name' => 'Japan 18 - 27 November 2026',
            ])
            ->assertCreated()
            ->assertJsonPath('data.end_date', null);
    }

    public function test_the_lengths_match_the_crm_columns(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/tours', [
                'tour_code' => str_repeat('a', 51),
                'tour_name' => str_repeat('b', 201),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['tour_code', 'tour_name']);
    }

    /**
     * PostgreSQL sorts nulls first on an ascending order, which would float
     * every undated tour above the dated ones an editor is looking for.
     */
    public function test_an_undated_tour_sorts_last_rather_than_first(): void
    {
        Tour::create(['tour_code' => 'C', 'tour_name' => 'No date yet']);
        Tour::create(['tour_code' => 'A', 'tour_name' => 'Ends soonest', 'end_date' => '2026-06-02']);
        Tour::create(['tour_code' => 'B', 'tour_name' => 'Ends later', 'end_date' => '2026-12-20']);

        $names = collect(
            $this->actingAs($this->admin())->getJson('/api/admin/tours')->json('data')
        )->pluck('tour_name')->all();

        $this->assertSame(['Ends soonest', 'Ends later', 'No date yet'], $names);
    }

    /**
     * PostgreSQL's LIKE is case sensitive where MySQL's, under a `_ci`
     * collation, was not. Searching for a name in the wrong case must still
     * find it.
     */
    public function test_search_is_case_insensitive_and_covers_the_code(): void
    {
        Tour::create(['tour_code' => 'Coorg30052026', 'tour_name' => 'Coorg 30 May']);
        Tour::create(['tour_code' => 'Japan18112026', 'tour_name' => 'Japan November']);

        $admin = $this->admin();

        $this->actingAs($admin)->getJson('/api/admin/tours?search=coorg')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tour_name', 'Coorg 30 May');

        /* The same search term, matched against the code instead. */
        $this->actingAs($admin)->getJson('/api/admin/tours?search=JAPAN18')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tour_name', 'Japan November');
    }

    public function test_an_editor_deletes_a_tour(): void
    {
        $tour = Tour::create(['tour_code' => 'Hampi070926', 'tour_name' => 'Hampi']);

        $this->actingAs($this->admin())
            ->deleteJson('/api/admin/tours/'.$tour->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('tours', ['id' => $tour->id]);
    }

    /**
     * The picker other modules attach a record to. It reads `tour_name`, which
     * is what the client's CRM calls the column — an earlier build looked for
     * `title` and would now find nothing.
     */
    public function test_the_tour_picker_lists_tours_by_name(): void
    {
        Tour::create(['tour_code' => 'B', 'tour_name' => 'Bhutan']);
        Tour::create(['tour_code' => 'A', 'tour_name' => 'Andaman']);

        $this->assertSame(
            ['Andaman', 'Bhutan'],
            array_column(app(TourChoices::class)->all(), 'name'),
        );
    }
}
