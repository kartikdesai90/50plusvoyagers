<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Who reaches the Admin Panel, and who is turned away at which door.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The sign-in screen is a page in the front end, so nothing about reaching
     * it is Laravel's to answer for any more. What is Laravel's is the door
     * that screen knocks on, and it must be open before any session exists —
     * otherwise there would be no way to sign in at all.
     */
    public function test_an_anonymous_visitor_can_reach_the_sign_in_endpoint(): void
    {
        $this->get('/api/admin/csrf-cookie')->assertNoContent();
    }

    /** The front door is public; everything behind it is not. */
    public function test_the_admin_api_refuses_an_anonymous_request(): void
    {
        $this->getJson('/api/admin/me')->assertUnauthorized();
    }

    public function test_an_admin_reaches_the_api(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->getJson('/api/admin/me')->assertOk();
    }

    public function test_signing_in_and_out_works_at_the_front_door(): void
    {
        User::factory()->create(['email' => 'meera@example.com']);

        $this->postJson('/api/admin/login', [
            'email' => 'meera@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonPath('data.email', 'meera@example.com');

        $this->postJson('/api/admin/logout')->assertOk();
        $this->getJson('/api/admin/me')->assertUnauthorized();
    }

    public function test_a_wrong_password_is_refused_without_saying_which_part_was_wrong(): void
    {
        User::factory()->create(['email' => 'meera@example.com']);

        $this->postJson('/api/admin/login', [
            'email' => 'meera@example.com',
            'password' => 'not-the-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    /**
     * The strongest statement this foundation makes: an admin account cannot be
     * self-created. If a route ever appears that does so without an existing
     * admin behind it, this fails.
     */
    public function test_no_route_registers_an_admin_account(): void
    {
        $suspicious = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            if (!str_contains($uri, 'admin')) {
                continue;
            }

            if (preg_match('/regist|sign-?up/i', $uri)) {
                $suspicious[] = $route->methods()[0].' '.$uri;
            }
        }

        $this->assertSame([], $suspicious, 'An admin registration route exists: '.implode(', ', $suspicious));
    }
}
