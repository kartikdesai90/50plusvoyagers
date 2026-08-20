<?php

namespace Tests\Feature\Admin;

use App\Models\Feedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * What travellers said, from the admin's side.
 *
 * One module carries two kinds of record, so the cases that matter are the ones
 * where the kind decides the rules: a written quote with nothing written in it,
 * and a filmed one with no film. Both would render as an empty space on the
 * homepage, which is the one place nobody is watching.
 */
class FeedbackManagementTest extends TestCase
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

    private function picture(string $name = 'face.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 600, 600);
    }

    /** A file the validator will read as a real video. */
    private function video(string $name = 'clip.mp4'): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'clip').'.mp4';
        file_put_contents(
            $path,
            hex2bin('0000001C667479706D703432000000006D70343269736F6D').str_repeat("\0", 1024),
        );

        return new UploadedFile($path, $name, 'video/mp4', null, true);
    }

    /** @return array<string, mixed> */
    private function textPayload(array $overrides = []): array
    {
        return array_merge([
            'type' => 'text',
            'customer_name' => 'Kamala Iyer',
            'customer_location' => 'Bengaluru, India',
            'feedback_text' => 'Nine unhurried days and I never once felt rushed.',
            'is_featured' => false,
            'is_active' => true,
            'display_order' => 0,
        ], $overrides);
    }

    public function test_a_signed_out_visitor_cannot_reach_the_feedback(): void
    {
        $this->getJson('/api/admin/feedback')->assertUnauthorized();
    }

    /* ----------------------------------------------------------- writing one */

    public function test_a_written_testimonial_is_created(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/feedback', $this->textPayload())
            ->assertCreated()
            ->assertJsonPath('data.type', 'text')
            ->assertJsonPath('data.customer_name', 'Kamala Iyer');

        $this->assertSame(1, Feedback::count());
    }

    public function test_a_written_testimonial_must_say_something(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/feedback', $this->textPayload(['feedback_text' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('feedback_text');
    }

    public function test_every_testimonial_needs_a_name(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/feedback', $this->textPayload(['customer_name' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('customer_name');
    }

    /* ------------------------------------------------------------ filming one */

    public function test_a_filmed_testimonial_is_created_from_a_link(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/feedback', $this->textPayload([
                'type' => 'video',
                'feedback_text' => '',
                'video_url' => 'https://videos.example.com/kamala.mp4',
            ]))
            ->assertCreated()
            ->assertJsonPath('data.type', 'video')
            ->assertJsonPath('data.video_is_uploaded', false)
            ->assertJsonPath('data.video_source', 'https://videos.example.com/kamala.mp4');
    }

    public function test_a_filmed_testimonial_is_created_from_an_upload(): void
    {
        $response = $this->actingAs($this->admin())
            ->post('/api/admin/feedback', $this->textPayload([
                'type' => 'video',
                'feedback_text' => '',
                'video_file' => $this->video(),
                'thumbnail_file' => $this->picture('still.jpg'),
            ]))
            ->assertCreated()
            ->assertJsonPath('data.video_is_uploaded', true);

        $record = Feedback::firstOrFail();
        Storage::disk('public')->assertExists($record->video_path);
        Storage::disk('public')->assertExists($record->thumbnail_path);
        $this->assertStringContainsString('/storage/', $response->json('data.video_source'));
    }

    /** A film has to come from somewhere. */
    public function test_a_filmed_testimonial_without_a_film_is_refused(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/feedback', $this->textPayload([
                'type' => 'video',
                'feedback_text' => '',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('video_url');

        $this->assertSame(0, Feedback::count());
    }

    public function test_a_picture_is_refused_where_a_video_belongs(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/feedback', $this->textPayload([
                'type' => 'video',
                'feedback_text' => '',
                'video_file' => $this->picture(),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('video_file');
    }

    public function test_a_video_is_refused_where_a_photo_belongs(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/admin/feedback', $this->textPayload([
                'photo_file' => $this->video(),
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('photo_file');
    }

    /* ------------------------------------------------------- the other fields */

    public function test_a_photo_is_stored(): void
    {
        $this->actingAs($this->admin())
            ->post('/api/admin/feedback', $this->textPayload([
                'photo_file' => $this->picture(),
            ]))
            ->assertCreated()
            ->assertJsonPath('data.photo_url', fn (?string $url) => filled($url));

        Storage::disk('public')->assertExists(Feedback::firstOrFail()->photo_path);
    }

    /* ------------------------------------------------------ reading, changing */

    public function test_the_list_is_filtered_by_kind_status_and_search(): void
    {
        $admin = $this->admin();

        Feedback::create($this->textPayload(['customer_name' => 'Kamala Iyer']));
        Feedback::create($this->textPayload([
            'customer_name' => 'Meera Nair',
            'is_active' => false,
        ]));
        Feedback::create($this->textPayload([
            'type' => 'video',
            'customer_name' => 'Rahul Menon',
            'feedback_text' => null,
            'video_url' => 'https://videos.example.com/rahul.mp4',
        ]));

        $this->actingAs($admin)->getJson('/api/admin/feedback')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonCount(2, 'meta.types');

        $this->actingAs($admin)->getJson('/api/admin/feedback?type=video')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.customer_name', 'Rahul Menon');

        $this->actingAs($admin)->getJson('/api/admin/feedback?status=inactive')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.customer_name', 'Meera Nair');

        $this->actingAs($admin)->getJson('/api/admin/feedback?search=kamala')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.customer_name', 'Kamala Iyer');
    }

    public function test_the_list_is_filtered_by_tour(): void
    {
        $admin = $this->admin();
        Feedback::create($this->textPayload(['customer_name' => 'On tour 7', 'tour_id' => 7]));
        Feedback::create($this->textPayload(['customer_name' => 'On tour 9', 'tour_id' => 9]));

        $this->actingAs($admin)->getJson('/api/admin/feedback?tour_id=9')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.customer_name', 'On tour 9');
    }

    public function test_the_order_an_editor_set_is_the_order_the_list_gets(): void
    {
        $admin = $this->admin();
        Feedback::create($this->textPayload(['customer_name' => 'Third', 'display_order' => 30]));
        Feedback::create($this->textPayload(['customer_name' => 'First', 'display_order' => 10]));
        Feedback::create($this->textPayload(['customer_name' => 'Second', 'display_order' => 20]));

        $this->actingAs($admin)->getJson('/api/admin/feedback')
            ->assertOk()
            ->assertJsonPath('data.0.customer_name', 'First')
            ->assertJsonPath('data.1.customer_name', 'Second')
            ->assertJsonPath('data.2.customer_name', 'Third');
    }

    public function test_the_words_are_changed_without_touching_the_files(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/feedback', $this->textPayload([
            'photo_file' => $this->picture(),
        ]))->assertCreated()->json('data');

        $originalPhoto = Feedback::firstOrFail()->photo_path;

        $this->actingAs($admin)
            ->post("/api/admin/feedback/{$created['id']}", $this->textPayload([
                'customer_name' => 'Kamala Iyer-Rao',
            ]))
            ->assertOk()
            ->assertJsonPath('data.customer_name', 'Kamala Iyer-Rao');

        $this->assertSame($originalPhoto, Feedback::firstOrFail()->photo_path);
        Storage::disk('public')->assertExists($originalPhoto);
    }

    public function test_replacing_a_photo_removes_the_one_it_replaced(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/feedback', $this->textPayload([
            'photo_file' => $this->picture('first.jpg'),
        ]))->assertCreated()->json('data');

        $first = Feedback::firstOrFail()->photo_path;

        $this->actingAs($admin)
            ->post("/api/admin/feedback/{$created['id']}", $this->textPayload([
                'photo_file' => $this->picture('second.jpg'),
            ]))
            ->assertOk();

        $second = Feedback::firstOrFail()->photo_path;

        $this->assertNotSame($first, $second);
        Storage::disk('public')->assertExists($second);
        Storage::disk('public')->assertMissing($first);
    }

    /** A quote keeps no film, and a film keeps no quote. */
    public function test_changing_the_kind_clears_what_the_other_kind_carried(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/feedback', $this->textPayload([
            'type' => 'video',
            'feedback_text' => '',
            'video_file' => $this->video(),
        ]))->assertCreated()->json('data');

        $film = Feedback::firstOrFail()->video_path;

        $this->actingAs($admin)
            ->post("/api/admin/feedback/{$created['id']}", $this->textPayload())
            ->assertOk()
            ->assertJsonPath('data.type', 'text')
            ->assertJsonPath('data.video_source', null);

        Storage::disk('public')->assertMissing($film);
    }

    public function test_a_testimonial_is_removed_along_with_its_files(): void
    {
        $admin = $this->admin();
        $created = $this->actingAs($admin)->post('/api/admin/feedback', $this->textPayload([
            'type' => 'video',
            'feedback_text' => '',
            'video_file' => $this->video(),
            'thumbnail_file' => $this->picture('still.jpg'),
            'photo_file' => $this->picture('face.jpg'),
        ]))->assertCreated()->json('data');

        $record = Feedback::firstOrFail();
        $paths = [$record->video_path, $record->thumbnail_path, $record->photo_path];

        $this->actingAs($admin)
            ->deleteJson("/api/admin/feedback/{$created['id']}")
            ->assertNoContent();

        $this->assertSame(0, Feedback::count());

        foreach ($paths as $path) {
            Storage::disk('public')->assertMissing($path);
        }
    }

    /** Until the Tours module exists there is nothing to attach feedback to. */
    public function test_the_form_is_told_which_tours_it_may_choose_from(): void
    {
        $this->actingAs($this->admin())
            ->getJson('/api/admin/feedback')
            ->assertOk()
            ->assertJsonPath('meta.tours', []);
    }
}
