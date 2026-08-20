<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The design's own pictures, after they became WebP files.
 *
 * The twenty-three photographs shipped under `public/images/home` were
 * re-encoded and the JPEGs removed, which left every row seeded from them
 * pointing at a file that no longer exists. The seeders were updated in the
 * same breath, but re-running them would not have repaired this: three of them
 * treat the picture's own path as the key they match a row on, so a `.webp`
 * path finds no `.jpg` row to update and inserts a second one beside it.
 *
 * So the rows are rewritten here instead — the file is the same photograph at
 * the same address, and only the extension moved.
 *
 * Deliberately narrow. Only paths under `/images/home` are touched: those are
 * the files that ship with the build and that were converted. An editor's
 * upload lives on a disk under a name of its own and is nobody's business but
 * the record that points at it.
 */
return new class extends Migration
{
    /** Every column that can hold one of the design's picture paths. */
    private const COLUMNS = [
        'hero_banners' => ['media_path'],
        'gallery_items' => ['image_path'],
        'blog_posts' => ['image_path'],
        'who_we_are_cards' => ['image_path'],
        'why_us_sections' => ['image_path'],
        'feedback' => ['photo_path', 'thumbnail_path'],
    ];

    public function up(): void
    {
        $this->rewrite('.jpg', '.webp');
    }

    /**
     * Back to the JPEGs.
     *
     * Worth having even though the files themselves are gone: rolling back
     * should leave the database as it found it, and what a path points at is
     * not this migration's to decide.
     */
    public function down(): void
    {
        $this->rewrite('.webp', '.jpg');
    }

    private function rewrite(string $from, string $to): void
    {
        foreach (self::COLUMNS as $table => $columns) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) {
                    continue;
                }

                DB::table($table)
                    ->where($column, 'like', '/images/home/%'.$from)
                    ->update([
                        $column => DB::raw(
                            $this->replacement($column, $from, $to),
                        ),
                    ]);
            }
        }
    }

    /**
     * SQLite spells this one differently, and the test suite runs on SQLite.
     */
    private function replacement(string $column, string $from, string $to): string
    {
        $driver = DB::connection()->getDriverName();
        $function = $driver === 'sqlite' ? 'replace' : 'REPLACE';

        return sprintf("%s(%s, '%s', '%s')", $function, $column, $from, $to);
    }
};
