<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The homepage's "Why travel with us" band.
 *
 * One row, not many — the same shape the site settings take, and for the same
 * reason: the homepage has one of these bands, in one fixed position, and a
 * table an editor could add a second row to would be a table that eventually
 * had one, with nothing to say which of them the page should draw.
 *
 * What is deliberately absent is the band's own title and the small line over
 * it. Those are the design's words, not the business's — they name the section
 * rather than saying anything that changes — so they stay written into the
 * front end, next to the layout they title. What is here is what an editor
 * actually maintains: the points, the photograph, and the words over it.
 *
 * The points are JSON rather than a table of their own. Nothing needs a point
 * to have an id, a page or a history — it is a line of text in a list, and the
 * order it is written in is the order it is shown in. That is the same call the
 * journal's tags and the footer's links made.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('why_us_sections', function (Blueprint $table) {
            $table->id();

            /* ------------------------------------------------------ points */
            // The ticked list beside the photograph, in the order it is shown.
            $table->json('points')->nullable();

            $table->string('button_text', 60)->nullable();
            $table->string('button_url', 2048)->nullable();

            /* ---------------------------------------------------- picture */
            // Stored the way every other module stores it: the path alone,
            // resolved against the one media disk, so moving to object storage
            // stays a configuration change. A path starting with a slash is a
            // file shipped with the build and needs no upload to keep working.
            $table->string('image_path', 2048)->nullable();

            /* ---------------------------------------------------- caption */
            // The words printed over the bottom of that photograph.
            $table->string('caption_heading', 160)->nullable();
            $table->string('caption_text', 500)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('why_us_sections');
    }
};
