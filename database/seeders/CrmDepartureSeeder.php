<?php

namespace Database\Seeders;

use App\Support\CrmDepartures;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A stand-in for the client's CRM schedule table, for development only.
 *
 * `tb_group_tour` belongs to the client's CRM. It is not ours, it has no
 * migration here, and on the live site it is already populated by their
 * operations team. Locally it simply does not exist, and everything that reads
 * it degrades to an empty list by design — which is honest, but it leaves the
 * homepage with no departure dates, so the calendar falls back to the mockup
 * departures the design ships with and none of the cards lead anywhere.
 *
 * So this seeder creates the table only when it is missing and fills it with
 * dates for the tours {@see TourSeeder} makes. Two rules keep it safe:
 *
 * - It never touches a `tb_group_tour` that already exists. On any machine
 *   pointed at the real CRM this seeder creates nothing and writes nothing.
 * - It is not a migration. Nothing in `database/migrations` builds this table,
 *   so a production deploy cannot create it by running migrations.
 *
 * The columns are only the ones {@see CrmDepartures} actually reads. This is a
 * fixture, not a reconstruction of the client's schema.
 */
class CrmDepartureSeeder extends Seeder
{
    /** The CRM's own word for a tour still open to travellers. */
    private const LIVE_STATUS = 'Active';

    private const TABLE = 'tb_group_tour';

    public function run(): void
    {
        if (!$this->ensureTable()) {
            return;
        }

        foreach ($this->departures() as $departure) {
            DB::table(self::TABLE)->updateOrInsert(
                ['tour_code' => $departure['tour_code']],
                $departure,
            );
        }
    }

    /**
     * Make the stand-in table, unless something already owns that name.
     *
     * Returns false when the table is already there — which on a machine
     * connected to the real CRM is the whole point: a fixture must never write
     * over live operational data.
     */
    private function ensureTable(): bool
    {
        if (Schema::hasTable(self::TABLE)) {
            /*
             * Already present. On a developer's machine that means this seeder
             * has run before and may add its rows; against the real CRM it
             * means the client's table is there and must be left alone. The two
             * are told apart by the marker column, which only this fixture has.
             */
            return Schema::hasColumn(self::TABLE, 'is_local_fixture');
        }

        Schema::create(self::TABLE, function (Blueprint $table) {
            $table->id();

            $table->string('tour_code', 100)->index();
            $table->string('tour_short_name', 150)->nullable();
            $table->date('tour_start_date')->nullable();
            $table->date('tour_end_date')->nullable();
            $table->unsignedSmallInteger('tour_nights')->nullable();
            $table->unsignedInteger('package_cost')->nullable();
            $table->unsignedInteger('early_bird_discount')->nullable();
            $table->unsignedInteger('single_supplement_cost')->nullable();
            $table->string('tour_status', 40)->nullable();
            $table->string('tour_booking_status', 40)->nullable();
            $table->string('tour_category', 40)->nullable();

            /*
             * How this table is known to be the fixture rather than the
             * client's own. Without it a second run could not tell a
             * development stand-in from live CRM data, and the safe assumption
             * — leave it alone — would stop the fixture updating its own rows.
             */
            $table->boolean('is_local_fixture')->default(true);
        });

        return true;
    }

    /**
     * Departures for the tours {@see TourSeeder} seeds.
     *
     * The codes are the stems those tours carry, because the join is made on
     * everything before the first digit of `tour_code`. Dates are held relative
     * to today so the calendar always has upcoming months to show — a fixture
     * pinned to fixed dates stops working the moment those dates pass.
     *
     * Spain gets two departures on purpose: one page serving several departures
     * is the case the real CRM has and the one most likely to be got wrong.
     *
     * @return list<array<string, mixed>>
     */
    private function departures(): array
    {
        $today = Carbon::today();

        return [
            $this->departure(
                'SPAINPORT'.$today->copy()->addMonths(2)->format('dmY'),
                'Spain & Portugal',
                $today->copy()->addMonths(2),
                12,
                554000,
                'International',
            ),
            $this->departure(
                'SPAINPORT'.$today->copy()->addMonths(5)->format('dmY'),
                'Spain & Portugal',
                $today->copy()->addMonths(5),
                12,
                568000,
                'International',
            ),
            $this->departure(
                'KERALA'.$today->copy()->addMonths(3)->format('dmY'),
                'Kerala',
                $today->copy()->addMonths(3),
                6,
                86500,
                'Domestic',
            ),
            /*
             * Japan was seeded as a tour but never given a departure, so it
             * published correctly and then vanished from the homepage — the
             * calendar files by start date and it had none. Every tour this
             * fixture is meant to cover needs a row here, or it is published
             * into a section that cannot show it.
             */
            $this->departure(
                'JAPAN'.$today->copy()->addMonths(7)->format('dmY'),
                'Japan in Autumn',
                $today->copy()->addMonths(7),
                12,
                489000,
                'International',
            ),
        ];
    }

    /** @return array<string, mixed> */
    private function departure(
        string $code,
        string $name,
        Carbon $starts,
        int $nights,
        int $cost,
        string $category,
    ): array {
        return [
            'tour_code' => $code,
            'tour_short_name' => $name,
            'tour_start_date' => $starts->toDateString(),
            'tour_end_date' => $starts->copy()->addDays($nights)->toDateString(),
            'tour_nights' => $nights,
            'package_cost' => $cost,
            'early_bird_discount' => 15000,
            'single_supplement_cost' => 65000,
            'tour_status' => self::LIVE_STATUS,
            'tour_booking_status' => 'Booking Open',
            'tour_category' => $category,
            'is_local_fixture' => true,
        ];
    }
}
