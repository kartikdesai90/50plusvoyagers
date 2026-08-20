<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * The homepage's content comes out of the database, so this needs the
     * schema to exist. It does not need any rows: an unconfigured site still
     * has a homepage, and the front end falls back to the content written into
     * it.
     */
    use RefreshDatabase;

    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/api/site/home');

        $response->assertStatus(200);
    }
}
