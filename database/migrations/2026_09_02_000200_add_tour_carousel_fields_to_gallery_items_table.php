<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Let the gallery hold a tour's carousel as well as the wall.
 *
 * There were two tables of photographs: `gallery_items`, which already carried
 * a `tour_id`, and `tour_images`, which carried the same files again. Four of
 * the five pictures in the build existed in both — one photograph, two rows,
 * two captions free to drift apart and two independent orderings of the same
 * set. That is the duplication, and it is what this removes.
 *
 * Two columns are all `gallery_items` was missing:
 *
 * - `alt` is what a screen reader announces. The gallery has always derived it
 *   from the caption or the title, and still does when this is null; a tour
 *   carousel can now say something specific instead. Nullable rather than
 *   required because every existing row would otherwise need one before this
 *   migration could run, and the derivation is a real fallback rather than an
 *   empty string.
 * - `is_cover` marks the one picture a tour page leads with.
 *
 * `is_active` was already there and keeps its meaning: it decides what reaches
 * the public gallery. A tour photograph appears on the wall like any other and
 * an editor switches it off if it should not.
 *
 * `tour_images` is dropped here rather than left in place. Nothing reads it
 * after this, and a spare table of photographs is exactly the thing someone
 * writes to by mistake a year from now.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gallery_items', function (Blueprint $table) {
            $table->string('alt')->nullable()->after('caption');
            $table->boolean('is_cover')->default(false)->after('is_featured');

            /*
             * The tour page's own query: this tour's pictures, in the editor's
             * order. `tour_id` alone was indexed for the admin's filter, which
             * is a different question.
             */
            $table->index(['tour_id', 'display_order'], 'gallery_tour_order_index');
        });

        Schema::dropIfExists('tour_images');
    }

    public function down(): void
    {
        Schema::table('gallery_items', function (Blueprint $table) {
            $table->dropIndex('gallery_tour_order_index');
            $table->dropColumn(['alt', 'is_cover']);
        });

        /*
         * Rebuilt as it was, so a rollback lands on the schema the earlier
         * migration left rather than merely on a database without these two
         * columns. The rows themselves are not restored — they are the gallery's
         * now, and this migration is the one that made them so.
         */
        Schema::create('tour_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();

            $table->string('image_path', 2048);
            $table->string('alt');
            $table->string('caption')->nullable();

            $table->boolean('is_cover')->default(false);
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['tour_id', 'display_order']);
        });
    }
};
