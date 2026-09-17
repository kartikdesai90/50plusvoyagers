<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The page a tour has, beside the record the CRM keeps of it.
 *
 * The five CRM columns are left exactly as the client gave them. Everything
 * here is added beside them and every one is nullable, so a tour recorded from
 * the CRM keeps working before anybody has written its page.
 *
 * What is deliberately *not* here: price, start date, nights and booking
 * status. Those live in `tb_group_tour` and are read from it, so a page can
 * never disagree with the CRM about what a tour costs.
 *
 * The `meta_*` and `og_*` columns exist because the client was explicit that
 * the existing meta and H1 text must survive the move. Carrying them verbatim
 * is only possible if there is somewhere to carry them to.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            // The address. Unique where present; a tour without a page has none.
            $table->string('slug', 160)->nullable()->unique();
            $table->text('legacy_url')->nullable();

            /*
             * The page's own H1, where it differs from the CRM's name for the
             * tour. `tour_name` is "Coorg 30 May - 2 June 2026" — a departure.
             * The H1 is "Coorg - The Coffee Capital of India" — a place. Both
             * are right for their own job.
             */
            $table->string('page_title')->nullable();
            $table->string('subtitle')->nullable();
            $table->string('region', 20)->nullable();
            $table->text('summary')->nullable();
            $table->string('ribbon_text', 80)->nullable();

            $table->text('route_map_path')->nullable();

            $table->text('visa_html')->nullable();

            // Both differ per tour — ₹10,000/10 days for Coorg, ₹2,50,000/60
            // for Spain-Portugal — so neither can be a site-wide setting.
            $table->integer('booking_fee')->nullable();
            $table->smallInteger('balance_due_days')->nullable();

            /* Carried across verbatim from the existing HTML. Never rewritten. */
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
            $table->text('og_image_path')->nullable();
            $table->text('canonical_url')->nullable();

            $table->string('status', 20)->default('draft');
            $table->integer('display_order')->default(0);

            // What the public listing asks for, in the order it asks for it.
            $table->index(['status', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            $table->dropIndex(['status', 'display_order']);

            $table->dropColumn([
                'slug', 'legacy_url', 'page_title', 'subtitle', 'region', 'summary',
                'ribbon_text', 'route_map_path', 'visa_html',
                'booking_fee', 'balance_due_days', 'meta_title', 'meta_description',
                'meta_keywords', 'og_title', 'og_description', 'og_image_path',
                'canonical_url', 'status', 'display_order',
            ]);
        });
    }
};
