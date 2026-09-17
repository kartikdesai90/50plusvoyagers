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
 *
 * The long URL and path columns are `text` rather than a wide `varchar`. Under
 * `utf8mb4` MySQL counts four bytes per character towards InnoDB's 65535-byte
 * row limit, and nine 2048-character columns on one row overflow it outright;
 * `text` is stored away from the row and does not count against that. None of
 * them is indexed, which is the only thing the change would have cost.
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
            $table->text('map_url')->nullable();

            /* ----------------------------------------------------- social */
            $table->text('facebook_url')->nullable();
            $table->text('instagram_url')->nullable();
            $table->text('youtube_url')->nullable();
            $table->text('linkedin_url')->nullable();
            $table->text('twitter_url')->nullable();
            /*
             * Anywhere else the business has an account. JSON rather than a
             * table of its own for the same reason the journal's tags are:
             * nothing needs a social link to have a page, an id or a history.
             */
            $table->json('other_socials')->nullable();

            /* ---------------------------------------------------- website */
            $table->text('logo_path')->nullable();
            $table->string('logo_alt', 255)->nullable();
            $table->text('favicon_path')->nullable();
            $table->text('website_url')->nullable();

            /* -------------------------------------------------------- SEO */
            // What a page falls back to when it writes no metadata of its own.
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();
            $table->text('og_image_path')->nullable();

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
