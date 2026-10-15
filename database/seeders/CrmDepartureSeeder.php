<?php

namespace Database\Seeders;

use App\Support\CrmDepartures;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sample rows for the client's CRM schedule table, for development only.
 *
 * `tb_group_tour` belongs to the client's CRM. It is not ours to own the data
 * in, but the table itself is now created by
 * `2026_09_22_000100_create_tb_group_tour_table.php` with the client's real
 * export schema, because some of the project's older files expect that full
 * structure to exist locally. On the live site the table is already populated
 * by the client's operations team; locally, after that migration runs, it
 * exists but is empty, which leaves the homepage with no departure dates — the
 * calendar falls back to the mockup departures the design ships with and none
 * of the cards lead anywhere.
 *
 * So this seeder fills it with dates for the tours {@see TourSeeder} makes.
 * One rule keeps it safe: it writes only rows whose `tour_code` it set itself
 * (`updateOrInsert` keyed on `tour_code`), so re-running it cannot touch a row
 * the client's own CRM wrote. It does not create or alter the table — that is
 * the migration's job now, not this seeder's.
 */
class CrmDepartureSeeder extends Seeder
{
    /** The CRM's own word for a tour still open to travellers. */
    private const LIVE_STATUS = 'Active';

    private const TABLE = 'tb_group_tour';

    public function run(): void
    {
        if (!Schema::hasTable(self::TABLE)) {
            // No table to seed into. On an environment that has not run
            // migrations yet, this is nothing to fail over.
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
                'SpainPortugal'.$today->copy()->addMonths(2)->format('dmY'),
                'Spain & Portugal',
                $today->copy()->addMonths(2),
                12,
                554000,
                'International',
                50000,
            ),
            $this->departure(
                'SpainPortugal'.$today->copy()->addMonths(5)->format('dmY'),
                'Spain & Portugal',
                $today->copy()->addMonths(5),
                12,
                568000,
                'International',
                50000,
            ),
            $this->departure(
                'kerala'.$today->copy()->addMonths(3)->format('dmY'),
                'Kerala',
                $today->copy()->addMonths(3),
                6,
                86500,
                'Domestic',
                15000,
            ),
            /*
             * Japan was seeded as a tour but never given a departure, so it
             * published correctly and then vanished from the homepage — the
             * calendar files by start date and it had none. Every tour this
             * fixture is meant to cover needs a row here, or it is published
             * into a section that cannot show it.
             */
            $this->departure(
                'Japan'.$today->copy()->addMonths(7)->format('dmY'),
                'Japan in Autumn',
                $today->copy()->addMonths(7),
                12,
                489000,
                'International',
                60000,
            ),
        ];
    }

    /**
     * One row, filled out to the client's real schema.
     *
     * The table's `NOT NULL` columns need a value even where {@see
     * CrmDepartures} never reads them — `rooms_details`, `operations`,
     * `trf_link` and the like — so those get the same empty-but-present
     * values the client's own export uses for a tour that has none (`''`,
     * `0`). Nothing here is invented data; it is exactly what an unset column
     * looks like in the client's dump.
     *
     * @return array<string, mixed>
     */
    private function departure(
        string $code,
        string $name,
        Carbon $starts,
        int $nights,
        int $cost,
        string $category,
        int $advance = 15000,
    ): array {
        $ends = $starts->copy()->addDays($nights);

        return [
            'tour_code' => $code,
            'tour_name' => $name.' '.$starts->format('j M').' - '.$ends->format('j M Y'),
            'tour_short_name' => $name,
            'tour_big_name' => $name,
            'tour_website_name' => $name,
            'tour_start_date' => $starts->toDateString(),
            'tour_end_date' => $ends->toDateString(),
            'tour_days' => $nights + 1,
            'tour_nights' => $nights,
            'tour_status' => self::LIVE_STATUS,
            'tour_booking_status' => 'Booking Open',
            'tour_accounting_status' => 'Open',
            'tour_release_date' => Carbon::today()->toDateString(),
            'tour_category' => $category,
            'package_cost' => $cost,
            'senior_discount' => 0,
            'early_bird_discount' => 15000,
            'early_bird_discount_date' => $starts->copy()->subMonth()->toDateString(),
            'early_bird_status' => 0,
            'single_supplement_cost' => 65000,
            'triple_occu_cost' => 0,
            'tour_advance' => $advance,
            'total_rooms_booked' => 0,
            'rooms_details' => '',
            'rooms_occupied' => '',
            'room_available' => '',
            'operations' => '',
            'tour_manager_name' => '',
            'tm_flight_train_status' => '',
            'tour_feedback' => '',
            'tour_website_link' => '',
            'trf_link' => '',
            'create_user_id' => null,
            'create_date' => Carbon::now()->toDateTimeString(),
            'modify_user_id' => null,
            'modify_date' => null,
        ];
    }
}
