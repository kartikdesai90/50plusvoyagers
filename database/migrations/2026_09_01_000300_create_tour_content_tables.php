<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The repeating blocks of a tour page.
 *
 * Three tables for the seven lists the page repeats. Each exists because the
 * content is a list rather than a value — that is the whole test, and it is why
 * the visa prose is a column on `tours` and the itinerary is not.
 *
 * Lists of the same shape share a table with a `kind`, because two tables of
 * identical columns are one schema written twice:
 *
 * - `tour_list_items` holds the highlights, the inclusions and the exclusions.
 *   All three are a paragraph in an order and nothing else.
 * - `tour_booking_steps` holds the three numbered lists — how to book, the
 *   documents required, the travel guidelines. All three are a number and a
 *   paragraph.
 *
 * The inclusions once had a thumbnail of their own, which is why they were a
 * table apart. The design dropped it — at that size a photograph of a hotel is
 * a smudge — and with the picture went the only column that told an inclusion
 * from an exclusion.
 *
 * What is still separate is separate on shape: the itinerary carries a hotel,
 * the meals and a date; the numbered lists carry a number that is printed.
 *
 * No carousel table either. `gallery_items` already held photographs with a
 * `tour_id`, and a second table meant the same picture filed twice — so a
 * tour's carousel is that table, read by `tour_id`.
 *
 * No testimonials table. `feedback` already carries `customer_name`,
 * `customer_location`, `feedback_text` and a `tour_id`, and it has the
 * editor's approval step that a public page needs.
 */
return new class extends Migration
{
    public function up(): void
    {
        /*
         * The three unnumbered lists: the highlights under the opening
         * prose, what the price covers, and what it does not.
         *
         * One table with a `kind`, for the reason the numbered lists below
         * share one: they are the same shape — a tour, a paragraph, a place in
         * the order — and two tables would be one schema written twice.
         */
        Schema::create('tour_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();

            $table->string('kind', 20);   // highlight | inclusion | exclusion
            $table->text('body_html');
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();

            // The page asks for one kind at a time, in order.
            $table->index(['tour_id', 'kind', 'display_order']);
        });

        /* The day-by-day. */
        Schema::create('tour_itinerary_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();

            $table->unsignedSmallInteger('day_number');
            $table->string('heading');                   // "Day 1: Arrive Porto"
            $table->string('title')->nullable();         // "Portugal's riverside rebel"
            $table->text('body_html');
            $table->string('stay')->nullable();          // "4* Hotel in Porto"
            $table->string('meals')->nullable();         // "Breakfast, Dinner"

            /*
             * Normally null and derived from the CRM's `tour_start_date` plus
             * the day number, so re-running a tour next year does not mean
             * editing thirteen dates by hand. Kept as an override for the tour
             * that genuinely needs one.
             */
            $table->date('day_date')->nullable();

            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();

            // A tour cannot have two day fours.
            $table->unique(['tour_id', 'day_number']);
            $table->index(['tour_id', 'display_order']);
        });

        /* The numbered lists: booking steps, documents, travel guidelines. */
        Schema::create('tour_booking_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained()->cascadeOnDelete();

            $table->string('kind', 20);   // booking | documents | guidelines
            $table->unsignedSmallInteger('step_number');
            $table->text('body_html');
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->timestamps();

            // The page asks for one kind at a time, in order.
            $table->index(['tour_id', 'kind', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_booking_steps');
        Schema::dropIfExists('tour_itinerary_days');
        Schema::dropIfExists('tour_list_items');
    }
};
