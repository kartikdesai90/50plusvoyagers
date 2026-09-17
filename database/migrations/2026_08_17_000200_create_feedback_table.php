<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What travellers said about travelling with us.
 *
 * One table for both a written quote and a filmed one. They are the same record
 * — a person, where they are from, how they rated it, and what they said — and
 * only the way the saying is carried differs. Two tables would mean two of
 * every query, form and screen for one idea.
 *
 * Files are not stored here. A disk and a path are, so moving to object storage
 * or a CDN stays a configuration change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();

            // text · video
            $table->string('type', 20);

            $table->string('customer_name', 120);
            $table->string('customer_location', 120)->nullable();

            // Required for a written one; empty on a filmed one.
            $table->text('feedback_text')->nullable();

            /*
             * A film arrives either as a link to somewhere it already lives or
             * as a file of our own. Both are kept: the link is what most people
             * have, and the upload is for when there is no link to give.
             */
            $table->string('video_url', 2048)->nullable();
            $table->string('video_path', 2048)->nullable();

            /*
             * The still shown before a film is played. No description is stored
             * beside either picture: both are portraits of the traveller named
             * on the record, so the name is the description, and asking an
             * editor to type it a second time only invites the two to disagree.
             */
            $table->string('thumbnail_path', 2048)->nullable();

            $table->string('photo_path', 2048)->nullable();

            // Out of five, or nothing at all — not every traveller gives one.
            $table->unsignedTinyInteger('rating')->nullable();

            /*
             * The tour this is about. No foreign key yet: the tours table does
             * not exist in this build, and a constraint pointing at nothing
             * cannot be created. The column is here so that nothing has to be
             * migrated when it does.
             */
            $table->unsignedBigInteger('tour_id')->nullable();

            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);

            $table->timestamps();

            // The query the public site will make, in the order it needs.
            $table->index(['type', 'is_active', 'display_order'], 'feedback_visible_index');
            $table->index(['is_featured', 'display_order'], 'feedback_featured_index');
            $table->index('tour_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
