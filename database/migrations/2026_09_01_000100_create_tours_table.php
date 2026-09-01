<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The group tours, as the client's CRM already describes them.
 *
 * Five columns, and deliberately only five: this is the `tours` table from the
 * client's own CRM export, carried across unchanged. Nothing has been added to
 * it — not a price, not a start date, not a picture — because the shape is
 * theirs to extend and inventing columns here would mean reconciling two
 * different ideas of the same table later.
 *
 * What that means in practice, and it is worth stating plainly: this is not yet
 * enough to render a tour card. The homepage needs a price, a departure date, a
 * duration and an image, and none of the five are here. So the homepage stays
 * on its static catalogue until those columns are agreed and added in a
 * later migration. What this table gives us today is the module — the admin
 * screen, the endpoints, the model — ready for them.
 *
 * `tour_code` is unique because it is how the CRM identifies a departure, and a
 * duplicate would make the eventual join to `tb_group_tour` ambiguous.
 *
 * `end_date` is nullable exactly as the CRM has it. There is no `start_date`:
 * the client's table does not carry one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tours', function (Blueprint $table) {
            $table->id();

            // How the CRM names a departure — 'EUR-2026-001', 'Coorg30052026'.
            $table->string('tour_code', 50)->unique();
            $table->string('tour_name', 200);

            $table->date('end_date')->nullable();

            // `timestamps()` rather than the CRM's lone `created_at`: an
            // editable row needs to record when it was last touched, and the
            // extra column costs nothing to a CRM that ignores it.
            $table->timestamps();

            // The listing's default order — newest first, by the date the CRM
            // knows rather than the row's own age.
            $table->index('end_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tours');
    }
};
