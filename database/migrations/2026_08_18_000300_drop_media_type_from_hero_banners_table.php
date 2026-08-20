<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A band shows a picture. It no longer shows a film.
 *
 * The column went with the choice: with only one kind of media left there is
 * nothing for it to record, and a column that can only hold one value is a
 * column every reader has to check anyway.
 *
 * Bands that were showing a film are switched off rather than deleted. Their
 * row is somebody's work and their file is still on disk — an editor can open
 * one, put a picture on it and switch it back on. Deleting them would have been
 * tidier and unrecoverable, and this migration cannot know which of those the
 * business wanted.
 *
 * The file itself is deliberately left alone. `FileStore` is what removes an
 * upload nothing points at, and the row still points at this one.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('hero_banners')
            ->where('media_type', 'video')
            ->update(['is_active' => false, 'updated_at' => now()]);

        Schema::table('hero_banners', function (Blueprint $table) {
            $table->dropColumn('media_type');
        });
    }

    /**
     * The column comes back, and every band is a picture — which is true of
     * every row that survived. What cannot come back is which bands were
     * switched off by the migration above rather than by a person.
     */
    public function down(): void
    {
        Schema::table('hero_banners', function (Blueprint $table) {
            $table->string('media_type', 20)->default('image')->after('section_type');
        });
    }
};
