<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The homepage's hero slides and its full-width banner bands.
 *
 * One table rather than two: a hero slide and a banner are the same record —
 * a piece of media, a few words over it and somewhere to go — and the only
 * thing that differs is which band of the page renders it. Two tables would
 * mean two of every query, two forms and two chances to drift.
 *
 * The file itself is not stored here. `media_disk` plus `media_path` is, so
 * moving from local storage to object storage stays a configuration change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_banners', function (Blueprint $table) {
            $table->id();

            // hero · banner — which band of the homepage renders this.
            $table->string('section_type', 20);
            // image · video — what the band shows behind its words.
            $table->string('media_type', 20);

            $table->string('media_disk', 40)->default('public');
            $table->string('media_path', 2048);

            $table->string('label', 120)->nullable();
            $table->string('heading', 255);
            $table->text('description')->nullable();

            $table->string('button_text', 60)->nullable();
            $table->string('button_url', 2048)->nullable();

            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);

            $table->timestamps();

            // The one query the homepage makes, in the order it needs.
            $table->index(['section_type', 'is_active', 'display_order'], 'hero_banners_slot_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_banners');
    }
};
