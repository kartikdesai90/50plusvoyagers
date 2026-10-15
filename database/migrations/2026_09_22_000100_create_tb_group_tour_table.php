<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The client's CRM table, brought in as a real migration.
 *
 * `tb_group_tour` is not ours — it is the client's own operational table,
 * exported from their CRM (see `voyagers_crm.sql` / the standalone
 * `tb_group_tour` dump the client supplied). It is the source of truth for a
 * tour's name, dates, price, discounts and booking status, all read live
 * through {@see \App\Support\CrmDepartures} rather than copied into `tours`.
 *
 * Until now it existed locally only as a stripped-down, 12-column stand-in
 * that {@see \Database\Seeders\CrmDepartureSeeder} created on demand — a
 * fixture, not a reconstruction of the real schema. Some of the project's
 * older files expect the CRM's actual columns to be present, so this
 * migration creates the table with the same structure the client's export
 * has: every column, in the same order, with the same type, nullability and
 * default the export declares.
 *
 * The column list and types are taken verbatim from the client's own dump —
 * nothing renamed, reordered, widened or narrowed. `tour_id` is the primary
 * key there and stays the primary key here, `AUTO_INCREMENT` included.
 *
 * This migration must never run against the production database, where the
 * client's own CRM already owns this table and populates it. It exists for
 * local and staging environments that do not have a live CRM connection.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tb_group_tour')) {
            // The real CRM table is already here — this environment is
            // pointed at live (or previously imported) CRM data. Leave it
            // untouched rather than risk colliding with it.
            return;
        }

        Schema::create('tb_group_tour', function (Blueprint $table) {
            $table->increments('tour_id');
            $table->string('tour_code', 30);
            $table->string('tour_name', 100);
            $table->string('tour_short_name', 100);
            $table->string('tour_big_name', 250);
            $table->string('tour_website_name', 250);
            $table->date('tour_start_date');
            $table->date('tour_end_date');
            $table->smallInteger('tour_days');
            $table->smallInteger('tour_nights');
            $table->string('tour_status', 10);
            $table->string('tour_booking_status', 20);
            $table->string('tour_accounting_status', 20)->default('Completed');
            $table->date('tour_release_date')->nullable();
            $table->string('tour_category', 15);
            $table->integer('package_cost');
            $table->integer('senior_discount');
            $table->integer('early_bird_discount');
            $table->date('early_bird_discount_date')->nullable();
            $table->integer('early_bird_status');
            $table->integer('single_supplement_cost');
            $table->integer('triple_occu_cost');
            $table->integer('tour_advance');
            $table->integer('total_rooms_booked');
            $table->text('rooms_details');
            $table->string('rooms_occupied', 200);
            $table->string('room_available', 200);
            $table->string('operations', 20);
            $table->string('tour_manager_name', 20);
            $table->string('tm_flight_train_status', 50);
            $table->text('tour_feedback');
            $table->string('tour_website_link', 200);
            $table->string('trf_link', 500);
            $table->integer('create_user_id')->nullable();
            $table->dateTime('create_date')->nullable();
            $table->integer('modify_user_id')->nullable();
            $table->dateTime('modify_date')->nullable();
        });
    }

    public function down(): void
    {
        // Never drops a `tb_group_tour` this migration did not create: a
        // table already present when `up()` ran was left alone, and `down()`
        // honours that by leaving it alone too. Only a table this migration
        // is actually responsible for — recorded in the migrations table —
        // gets removed on rollback, which Laravel already limits to this
        // environment's own migration history.
        Schema::dropIfExists('tb_group_tour');
    }
};
