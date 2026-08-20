<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The words printed over the hero photograph.
 *
 * The hero has two pieces of copy, not one. Above the slider sit the label,
 * heading and description the band already carried; over the photograph itself
 * sits a second, smaller block — a badge, a line, a sentence and a link — which
 * until now was written into the front end. An editor could change everything
 * about the hero except the white text on the picture, which is the part a
 * visitor reads first.
 *
 * They belong to the band rather than to a settings row for the same reason the
 * heading does: the lead band is what the hero shows, and the copy over its
 * photograph is copy about that photograph.
 *
 * All nullable. Only the lead band's are ever read, a banner has no overlay at
 * all, and a hero whose caption is empty simply has no caption — the front end
 * draws nothing rather than drawing an empty box.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hero_banners', function (Blueprint $table) {
            // The small pill above the caption. Also printed under the slider,
            // where the design repeats it as a quiet label.
            $table->string('caption_label', 120)->nullable()->after('button_url');
            $table->string('caption_heading', 255)->nullable()->after('caption_label');
            $table->string('caption_text', 500)->nullable()->after('caption_heading');
            // The link in the corner of the photograph. Both halves or neither,
            // exactly like the band's own button.
            $table->string('caption_button_text', 60)->nullable()->after('caption_text');
            $table->string('caption_button_url', 2048)->nullable()->after('caption_button_text');
        });
    }

    public function down(): void
    {
        Schema::table('hero_banners', function (Blueprint $table) {
            $table->dropColumn([
                'caption_label',
                'caption_heading',
                'caption_text',
                'caption_button_text',
                'caption_button_url',
            ]);
        });
    }
};
