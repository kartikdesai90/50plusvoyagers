<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The four cards under "Who we are" on the homepage.
 *
 * A table of rows rather than one row with a list in it, which is where this
 * parts company with the band next to it: a card carries a photograph, and a
 * photograph is a file on a disk that has to be replaceable on its own. A JSON
 * column would make replacing one card's picture a rewrite of all four.
 *
 * The section's own title and the line over it are not here. Those are the
 * design's words — they name the section rather than saying anything that
 * changes — so they stay written into the front end. What an editor maintains
 * is the cards.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('who_we_are_cards', function (Blueprint $table) {
            $table->id();

            // Set in small capitals over the body text — a few words, not a
            // sentence, which is what the length is saying.
            $table->string('title', 80);
            $table->text('body')->nullable();

            $table->string('image_path', 2048)->nullable();

            // The same pair every list on this site is ordered and filtered by,
            // so "first" and "hidden" mean one thing across the admin.
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('display_order')->default(0);

            $table->timestamps();

            // What the homepage asks for, in the order it asks for it.
            $table->index(['is_active', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('who_we_are_cards');
    }
};
