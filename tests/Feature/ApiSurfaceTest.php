<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What Laravel answers on, and what it deliberately does not.
 *
 * This replaces the route-order suite. Order used to be correctness: the admin
 * API was registered ahead of an SPA catch-all, and getting that wrong answered
 * the API with an HTML document while nothing else in the suite noticed. The
 * catch-all went with the SPA shell it served, so the risk it guarded against
 * is gone — and a different one took its place.
 *
 * The new one is drift. Every address a person types belongs to the Next
 * application now, and Laravel answering HTML on any of them would mean two
 * things claiming the same URL, with whichever sits in front deciding what a
 * visitor sees. These assertions pin that boundary down.
 */
class ApiSurfaceTest extends TestCase
{
    use RefreshDatabase;

    /** The admin panel's front door, reachable before any session exists. */
    public function test_the_admin_api_answers(): void
    {
        $this->get('/api/admin/csrf-cookie')->assertNoContent();
    }

    /** What the homepage needs, without a session and without a token. */
    public function test_the_site_api_answers_anonymously(): void
    {
        $this->getJson('/api/site/home')
            ->assertOk()
            ->assertJsonStructure(['hero', 'banners', 'toasts', 'films']);
    }

    /**
     * The public addresses belong to the front end.
     *
     * Laravel answering any of these would be a second application competing
     * for the same URL. A 404 here is the correct answer and the intended one.
     */
    public function test_laravel_serves_no_public_pages(): void
    {
        foreach (['/', '/about', '/group-tours', '/blog', '/contact'] as $address) {
            $this->get($address)->assertNotFound();
        }
    }

    /** The admin screens belong to the front end for the same reason. */
    public function test_laravel_serves_no_admin_screens(): void
    {
        foreach (['/admin', '/admin/login', '/admin/hero-banner'] as $screen) {
            $this->get($screen)->assertNotFound();
        }
    }

    public function test_an_unknown_api_url_is_a_404(): void
    {
        $this->getJson('/api/does-not-exist')->assertNotFound();
        $this->getJson('/api/site/nothing-here')->assertNotFound();
    }

    /** The health check the deployment watches. */
    public function test_the_health_endpoint_answers(): void
    {
        $this->get('/up')->assertOk();
    }
}
