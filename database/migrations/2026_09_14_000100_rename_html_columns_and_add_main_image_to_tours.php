<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two changes: the prose columns stop claiming to hold HTML, and a tour gets a
 * main image of its own.
 *
 * **The renames.** Four columns were named `*_html` — three `body_html` and the
 * tour's `visa_html`. The suffix was always a misreading of what they hold: the
 * importer writes `textContent` with the tags already stripped, the public page
 * strips any markup it finds before rendering (deliberately — injecting
 * editor-typed content with `dangerouslySetInnerHTML` would be an XSS hole on
 * every tour page), and the admin now cleans pasted markup to text on the way
 * in. They are columns of prose, and `content` says so.
 *
 * `visa_html` becomes `visa_content` rather than `content`: it sits on `tours`
 * beside `summary` and `subtitle`, where a bare `content` would say nothing
 * about which content it is. The three child tables each hold one body per row,
 * so `content` is unambiguous there.
 *
 * **The new column.** `image_path` is the tour's own main image. Until now the
 * main picture was inferred — the cover flag on whichever `gallery_items` row
 * happened to carry it — which meant a tour could not have one that was not
 * also in its carousel, and an editor had no direct way to set it. This is a
 * path like every other stored file on the table (`route_map_path`,
 * `og_image_path`), nullable because a tour can be recorded long before anybody
 * photographs it.
 *
 * `image_path` rather than `main_image_path`: it is the name `gallery_items`
 * already uses for the same thing, and a tour has one image of its own, so
 * nothing needs distinguishing from anything else on this table.
 *
 * Nothing else changes. No column is dropped, no type is altered, and the data
 * in all four renamed columns travels with them — a rename preserves rows,
 * which a drop-and-add would not.
 */
return new class extends Migration
{
    /**
     * The three child tables whose single body column becomes `content`.
     *
     * Listed once so the up and the down cannot disagree about which tables
     * were touched.
     */
    private const BODY_TABLES = [
        'tour_list_items',
        'tour_itinerary_days',
        'tour_booking_steps',
    ];

    public function up(): void
    {
        foreach (self::BODY_TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->renameColumn('body_html', 'content');
            });
        }

        Schema::table('tours', function (Blueprint $table) {
            $table->renameColumn('visa_html', 'visa_content');
        });

        Schema::table('tours', function (Blueprint $table) {
            /*
             * `text` to match the other stored paths on this table rather than
             * a varchar: `route_map_path` and `og_image_path` are both text,
             * and a path that fits one should fit all three.
             *
             * Added after the rename above rather than in the same closure,
             * because a rename and an add in one statement is two different
             * kinds of change to reason about if either fails.
             */
            $table->text('image_path')->nullable()->after('route_map_path');
        });
    }

    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });

        Schema::table('tours', function (Blueprint $table) {
            $table->renameColumn('visa_content', 'visa_html');
        });

        foreach (self::BODY_TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->renameColumn('content', 'body_html');
            });
        }
    }
};
