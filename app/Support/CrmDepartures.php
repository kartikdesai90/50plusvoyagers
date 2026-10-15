<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * The departures the CRM holds for a tour.
 *
 * Price, dates, nights and booking state are read from `tb_group_tour` and are
 * never copied into our own tables. Copying them would mean a tour page and the
 * CRM could disagree about what a tour costs, and the page would be wrong.
 *
 * One page serves many departures — the CRM has two July departures for
 * `jog.html` — so this returns a list, matched on the destination stem of
 * `tour_code` rather than the whole code.
 *
 * Everything here degrades to an empty list rather than throwing. The CRM table
 * is not in our database during development, and a tour page that cannot reach
 * it should still render its own content with the price panel absent — not
 * return a 500.
 */
class CrmDepartures
{
    /** The CRM's own words for a tour that is still open to travellers. */
    private const LIVE_STATUS = 'Active';

    /**
     * Every upcoming departure for a match key, soonest first.
     *
     * @return list<array<string, mixed>>
     */
    public function forKey(?string $key): array
    {
        $key = trim((string) $key);

        if ($key === '' || !$this->available()) {
            return [];
        }

        try {
            return DB::table('tb_group_tour')
                /*
                 * The CRM's own codes carry a leading space on at least one row
                 * (' Kinnaur06062026'), so the comparison is made on trimmed
                 * values at both ends.
                 */
                ->whereRaw('LOWER(TRIM(tour_code)) LIKE ?', [mb_strtolower($key).'%'])
                ->where('tour_status', self::LIVE_STATUS)
                ->whereDate('tour_start_date', '>=', now()->toDateString())
                ->orderBy('tour_start_date')
                ->get()
                ->map(fn ($row) => [
                    'tour_code' => trim((string) $row->tour_code),
                    'starts_on' => $row->tour_start_date,
                    'ends_on' => $row->tour_end_date,
                    'nights' => $this->nights($row),
                    'price' => (int) ($row->package_cost ?? 0),
                    'advance' => (int) ($row->tour_advance ?? 0),
                    'early_bird' => (int) ($row->early_bird_discount ?? 0),
                    'single_supplement' => (int) ($row->single_supplement_cost ?? 0),
                    'booking_open' => trim((string) $row->tour_booking_status) === 'Booking Open',
                    'status' => trim((string) ($row->tour_status ?? '')),
                    'category' => trim((string) ($row->tour_category ?? '')),
                    'short_name' => trim((string) ($row->tour_short_name ?? '')),
                    'website_name' => trim((string) ($row->tour_website_name ?? '')),
                    'website_link' => trim((string) ($row->tour_website_link ?? '')),
                ])
                ->all();
        } catch (\Throwable $problem) {
            Log::warning('CRM departures unavailable', ['key' => $key, 'error' => $problem->getMessage()]);

            return [];
        }
    }

    /**
     * The soonest departure, which is what a page's price panel shows.
     *
     * @return array<string, mixed>|null
     */
    public function next(?string $key): ?array
    {
        return $this->forKey($key)[0] ?? null;
    }

    /**
     * Nights, calculated rather than read.
     *
     * `tour_nights` is declared in the CRM's table but absent from its data —
     * empty for all 32 rows — so the dates are the only honest source. The
     * column is still preferred where somebody has filled it in.
     */
    private function nights(object $row): ?int
    {
        $stated = (int) ($row->tour_nights ?? 0);

        if ($stated > 0) {
            return $stated;
        }

        if (empty($row->tour_start_date) || empty($row->tour_end_date)) {
            return null;
        }

        try {
            $days = Carbon::parse($row->tour_start_date)
                ->diffInDays(Carbon::parse($row->tour_end_date));

            return $days > 0 ? (int) $days : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Whether the CRM's table is reachable at all.
     *
     * Checked rather than assumed: during development our database does not
     * hold it, and every caller should get an empty list instead of an error.
     */
    public function available(): bool
    {
        try {
            return Schema::hasTable('tb_group_tour');
        } catch (\Throwable) {
            return false;
        }
    }
}
