<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stop copying CRM facts onto `tours`.
 *
 * These already live on `tb_group_tour` and are read live:
 *
 * | tours column        | tb_group_tour column                          |
 * | ------------------- | --------------------------------------------- |
 * | end_date            | tour_start_date, tour_end_date                |
 * | region              | tour_category                                 |
 * | booking_fee         | package_cost (price), tour_advance (deposit)  |
 * | legacy_url          | tour_website_link                             |
 * | status              | tour_status                                   |
 *
 * `balance_due_days` has no CRM column. It is dropped with the duplicated
 * booking terms rather than left as a lone website-owned number.
 *
 * What stays on `tours` is the page: address, prose, pictures, meta tags,
 * display order, and `tour_code` / `tour_name` as the join to a CRM row.
 *
 * Idempotent: each drop is guarded, so an environment that already ran an
 * earlier version of this file can migrate again after the extra columns
 * were added to the list.
 */
return new class extends Migration
{
    /** @var list<string> */
    private const COLUMNS = [
        'end_date',
        'legacy_url',
        'region',
        'booking_fee',
        'balance_due_days',
        'status',
    ];

    public function up(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            if (Schema::hasColumn('tours', 'end_date')) {
                $table->dropIndex(['end_date']);
            }

            if (Schema::hasColumn('tours', 'status') && Schema::hasIndex('tours', ['status', 'display_order'])) {
                $table->dropIndex(['status', 'display_order']);
            }
        });

        Schema::table('tours', function (Blueprint $table) {
            $drop = array_values(array_filter(
                self::COLUMNS,
                fn (string $column) => Schema::hasColumn('tours', $column),
            ));

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });

        Schema::table('tours', function (Blueprint $table) {
            if (Schema::hasColumn('tours', 'display_order') && ! Schema::hasIndex('tours', ['display_order'])) {
                $table->index('display_order');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tours', function (Blueprint $table) {
            if (Schema::hasIndex('tours', ['display_order']) && ! Schema::hasColumn('tours', 'status')) {
                $table->dropIndex(['display_order']);
            }
        });

        Schema::table('tours', function (Blueprint $table) {
            if (! Schema::hasColumn('tours', 'end_date')) {
                $table->date('end_date')->nullable();
                $table->index('end_date');
            }

            if (! Schema::hasColumn('tours', 'legacy_url')) {
                $table->text('legacy_url')->nullable();
            }

            if (! Schema::hasColumn('tours', 'region')) {
                $table->string('region', 20)->nullable();
            }

            if (! Schema::hasColumn('tours', 'booking_fee')) {
                $table->integer('booking_fee')->nullable();
            }

            if (! Schema::hasColumn('tours', 'balance_due_days')) {
                $table->smallInteger('balance_due_days')->nullable();
            }

            if (! Schema::hasColumn('tours', 'status')) {
                $table->string('status', 20)->default('draft');
            }
        });

        Schema::table('tours', function (Blueprint $table) {
            if (Schema::hasColumn('tours', 'status') && Schema::hasColumn('tours', 'display_order')
                && ! Schema::hasIndex('tours', ['status', 'display_order'])) {
                $table->index(['status', 'display_order']);
            }
        });
    }
};
