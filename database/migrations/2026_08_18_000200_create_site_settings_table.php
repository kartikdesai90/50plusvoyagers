<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Everything about the site that is true on every page of it.
 *
 * One row, not many. These are not records an editor creates and deletes — the
 * business has one telephone number and one Instagram account — so the table
 * holds a single row that is edited in place, and the model refuses to let a
 * second one matter. A key-value table was the alternative and was rejected:
 * every value here has a type and a validation rule of its own, and a column is
 * where those belong.
 *
 * Columns are grouped the way the screen groups them — how to reach us, where
 * to find us, what the site is called, what a search engine is told, and what
 * the footer says — so the form and the table can be read against each other.
 *
 * Nearly everything is nullable. A site with no LinkedIn account is not a site
 * with a broken settings row, and the public side falls back to what the design
 * ships with wherever a value is missing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();

            /* ---------------------------------------------------- contact */
            // The one value with no sensible fallback: everything from the
            // footer's wordmark to the `og:site_name` is built out of it.
            $table->string('company_name', 120);
            $table->string('email', 190)->nullable();
            $table->string('phone', 40)->nullable();
            // The second line, where a business has one.
            $table->string('phone_alt', 40)->nullable();
            // Stored as a number rather than a wa.me address: the link is
            // derived, so an editor cannot paste one that is subtly wrong.
            $table->string('whatsapp_number', 40)->nullable();
            $table->text('address')->nullable();
            $table->string('map_url', 2048)->nullable();

            /* ----------------------------------------------------- social */
            $table->string('facebook_url', 2048)->nullable();
            $table->string('instagram_url', 2048)->nullable();
            $table->string('youtube_url', 2048)->nullable();
            $table->string('linkedin_url', 2048)->nullable();
            $table->string('twitter_url', 2048)->nullable();
            /*
             * Anywhere else the business has an account. JSON rather than a
             * table of its own for the same reason the journal's tags are:
             * nothing needs a social link to have a page, an id or a history.
             */
            $table->json('other_socials')->nullable();

            /* ---------------------------------------------------- website */
            $table->string('logo_disk', 40)->nullable();
            $table->string('logo_path', 2048)->nullable();
            $table->string('logo_alt', 255)->nullable();
            $table->string('favicon_disk', 40)->nullable();
            $table->string('favicon_path', 2048)->nullable();
            $table->string('website_url', 2048)->nullable();

            /* -------------------------------------------------------- SEO */
            // What a page falls back to when it writes no metadata of its own.
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->string('meta_keywords', 500)->nullable();
            $table->string('og_image_disk', 40)->nullable();
            $table->string('og_image_path', 2048)->nullable();

            /* ----------------------------------------------------- footer */
            // The words after the ©. The year is not stored: a year in a
            // database is a year that is wrong every January.
            $table->string('copyright_text', 255)->nullable();
            $table->text('footer_description')->nullable();
            $table->json('footer_links')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
