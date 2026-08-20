<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Photographs from the road.
 *
 * Pictures only, deliberately: a film belongs to the band it plays behind or to
 * the traveller who recorded it, and both of those already have a home. A
 * gallery that accepted video would be a third place to look for one.
 *
 * The file is not stored here. A disk and a path are, so moving to object
 * storage or a CDN stays a configuration change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_items', function (Blueprint $table) {
            $table->id();

            $table->string('title', 160);
            // Shown under the picture. The description an editor writes for a
            // reader, as opposed to the one written for a screen reader.
            $table->text('caption')->nullable();

            $table->string('image_disk', 40)->default('public');
            $table->string('image_path', 2048);

            /*
             * The tour this was taken on. No foreign key yet: the tours table
             * does not exist in this build, and a constraint pointing at
             * nothing cannot be created. The column is here so that nothing has
             * to be migrated when it does.
             */
            $table->unsignedBigInteger('tour_id')->nullable();

            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);

            $table->timestamps();

            // The query a public gallery will make, in the order it needs.
            $table->index(['is_active', 'display_order'], 'gallery_visible_index');
            $table->index(['is_featured', 'display_order'], 'gallery_featured_index');
            $table->index('tour_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_items');
    }
};
