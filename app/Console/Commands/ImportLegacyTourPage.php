<?php

namespace App\Console\Commands;

use App\Models\Tour;
use App\Models\TourBookingStep;
use App\Models\TourItineraryDay;
use App\Models\TourListItem;
use App\Support\CrmDepartures;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Read one of the old tour pages into the database.
 *
 * The old site is 32 hand-written HTML pages built on the same Boomerang
 * template, which is what makes this possible: the markup differs in its
 * whitespace and its typos but not in its shape. Every page states its meta
 * tags in the head, its H1 in `.pg-opt h1`, its days in
 * `h4.article-label` followed by a `ul.timeline`, and so on.
 *
 * Written as a command rather than a one-off script because it has to run 32
 * times, and because a migration that can be re-run is a migration that can be
 * corrected. Re-importing a tour replaces its content and leaves the tour row —
 * and anything an editor has since changed about the page's own fields — alone
 * unless `--overwrite-page` says otherwise.
 *
 *   php artisan tour:import spain-portugal --file=storage/legacy/spain-portugal.html
 *
 * What it deliberately does not do is invent anything. A section the page does
 * not have becomes no rows, not a placeholder.
 */
class ImportLegacyTourPage extends Command
{
    protected $signature = 'tour:import
        {slug : The address the page will have}
        {--file= : Path to the saved HTML}
        {--code= : The CRM tour_code to attach it to}
        {--name= : The CRM tour_name, if the tour does not exist yet}
        {--region= : India or International, when the CRM cannot be reached}
        {--overwrite-page : Also rewrite the tour is own page fields}
        {--publish : Publish the tour once imported}';

    protected $description = 'Import one legacy tour HTML page into the database';

    public function handle(): int
    {
        $slug = (string) $this->argument('slug');
        $path = (string) $this->option('file');

        if (!is_file($path)) {
            $this->error("No such file: {$path}");

            return self::FAILURE;
        }

        $html = (string) file_get_contents($path);

        /*
         * The old pages are Windows-1252 mislabelled as UTF-8 in places — the
         * CRM has the same damage — so an en-dash arrives as "â€“". Repaired on
         * read, because the alternative is 32 pages of mojibake in the
         * database.
         */
        $html = $this->repairEncoding($html);

        $document = new \DOMDocument;
        libxml_use_internal_errors(true);
        $document->loadHTML('<?xml encoding="UTF-8">'.$html);
        libxml_clear_errors();

        $xpath = new \DOMXPath($document);

        $tour = $this->resolveTour($slug);

        if ($tour === null) {
            return self::FAILURE;
        }

        DB::transaction(function () use ($tour, $xpath, $slug) {
            if ($tour->wasRecentlyCreated || $this->option('overwrite-page')) {
                $this->fillPage($tour, $xpath, $slug);
            }

            /* Content is replaced wholesale: a re-import is a re-import. */
            $tour->images()->delete();
            $tour->highlights()->delete();
            $tour->itineraryDays()->delete();
            $tour->inclusions()->delete();
            $tour->exclusions()->delete();
            $tour->bookingSteps()->delete();

            $this->importHighlights($tour, $xpath);
            $this->importItinerary($tour, $xpath);
            $this->importInclusions($tour, $xpath);
            $this->importExclusions($tour, $xpath);
            $this->importSteps($tour, $xpath);

            if ($this->option('publish')) {
                $tour->status = Tour::STATUS_PUBLISHED;
            }

            $tour->save();
        });

        $tour->refresh()->loadCount([
            'highlights', 'itineraryDays', 'inclusions', 'exclusions', 'bookingSteps',
        ]);

        $this->info("Imported “{$tour->heading()}”  ({$tour->slug})");
        $this->table(
            ['highlights', 'days', 'inclusions', 'exclusions', 'steps'],
            [[
                $tour->highlights_count,
                $tour->itinerary_days_count,
                $tour->inclusions_count,
                $tour->exclusions_count,
                $tour->booking_steps_count,
            ]],
        );

        return self::SUCCESS;
    }

    /** The tour this page belongs to, found by slug or by CRM code. */
    private function resolveTour(string $slug): ?Tour
    {
        $tour = Tour::query()->where('slug', $slug)->first();

        if ($tour) {
            return $tour;
        }

        $code = (string) $this->option('code');

        if ($code !== '') {
            $tour = Tour::query()->where('tour_code', trim($code))->first();

            if ($tour) {
                $tour->slug = $slug;

                return $tour;
            }
        }

        $name = (string) $this->option('name');

        if ($code === '' || $name === '') {
            $this->error('No tour matches that address. Pass --code and --name to create one.');

            return null;
        }

        return Tour::create([
            'tour_code' => trim($code),
            'tour_name' => trim($name),
            'slug' => $slug,
        ]);
    }

    /** The page's own fields: meta, H1, subtitle, opening prose. */
    private function fillPage(Tour $tour, \DOMXPath $xpath, string $slug): void
    {
        $tour->fill([
            'legacy_url' => "/grouptour/{$slug}.html",
            'page_title' => $this->text($xpath, '//div[@class="pg-opt"]//h1'),
            'subtitle' => $this->subtitle($xpath),
            'meta_title' => $this->attr($xpath, '//title', null),
            'meta_description' => $this->attr($xpath, '//meta[translate(@name,"DESCRIPTION","description")="description"]', 'content'),
            'meta_keywords' => $this->attr($xpath, '//meta[translate(@name,"KEYWORDS","keywords")="keywords"]', 'content'),
            'og_title' => $this->attr($xpath, '//meta[@property="og:title"]', 'content'),
            'og_description' => $this->attr($xpath, '//meta[@property="og:description"]', 'content'),
            'summary' => $this->summary($xpath),
            'ribbon_text' => $this->text($xpath, '//div[contains(@class,"ribbon")]//span'),
            'region' => $this->option('region') ?: $this->region($tour),
        ]);
    }

    /**
     * The places line under the H1.
     *
     * Every `h5` that is not one of the mobile-only fact lines, joined. Those
     * carry `visible-xs` and repeat the date, duration and price that the CRM
     * already holds.
     */
    private function subtitle(\DOMXPath $xpath): ?string
    {
        $parts = [];

        foreach ($xpath->query('//div[@class="pg-opt"]//h5') as $node) {
            $class = $node->getAttribute('class');

            if (str_contains($class, 'visible-xs')) {
                continue;
            }

            $text = $this->clean($node->textContent);

            if ($text !== '') {
                $parts[] = $text;
            }
        }

        return $parts === [] ? null : implode(' · ', $parts);
    }

    /** The prose between the Highlights heading and its bullet list. */
    private function summary(\DOMXPath $xpath): ?string
    {
        $paragraphs = [];

        foreach ($xpath->query('//div[contains(@class,"col-md-12")]/p') as $node) {
            $text = $this->clean($node->textContent);

            // Long enough to be prose rather than a caption or a stray label.
            if (mb_strlen($text) > 120) {
                $paragraphs[] = $text;
            }

            if (count($paragraphs) >= 3) {
                break;
            }
        }

        return $paragraphs === [] ? null : implode("\n\n", $paragraphs);
    }

    /**
     * Domestic or international.
     *
     * Not read from the page: every one of them ends its title with
     * "| 50plusvoyagers.com, India", which is the company's own address rather
     * than the destination — a naive search for "india" called Spain-Portugal a
     * domestic tour.
     *
     * The CRM already answers this correctly on all 32 rows (`tour_category`,
     * Domestic or International), so that is what is used. Falling back to
     * International only when the CRM cannot be reached, because the domestic
     * tours are the ones whose pages carry no visa or currency sections and so
     * are the cheaper mistake to make in the other direction.
     */
    private function region(Tour $tour): ?string
    {
        $departure = app(CrmDepartures::class)->next($tour->crmMatchKey());
        $category = $departure['category'] ?? '';

        return match (mb_strtolower(trim((string) $category))) {
            'domestic' => 'India',
            'international' => 'International',
            default => null,
        };
    }

    /**
     * The bullets under the opening prose.
     *
     * `ul.list-check` is also what the "Member Benefits" panel uses in the
     * sidebar — commented out on most pages, live on some. Coorg caught this:
     * it has no highlights list at all, and imported one bullet reading "Early
     * Bird Discount(first few seats): Rs. 1,000".
     *
     * So only the lists in the main column count. The sidebar is `col-md-4`.
     */
    private function importHighlights(Tour $tour, \DOMXPath $xpath): void
    {
        $order = 0;

        $query = '//div[contains(@class,"col-md-8")]//ul[contains(@class,"list-check")]/li';

        foreach ($xpath->query($query) as $node) {
            $body = $this->clean($node->textContent);

            if ($body === '') {
                continue;
            }

            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_HIGHLIGHT,
                'content' => $body,
                'display_order' => $order++,
            ]);
        }
    }

    /**
     * The day-by-day.
     *
     * Each day is an `h4.article-label` followed by a `ul.timeline` holding the
     * sub-heading, the prose and the footer of stay and meals. The date printed
     * in that footer is deliberately dropped — it is re-derived from the CRM's
     * departure date, so re-running the tour next year does not mean editing
     * thirteen dates by hand.
     */
    private function importItinerary(Tour $tour, \DOMXPath $xpath): void
    {
        $number = 0;

        foreach ($xpath->query('//h4[contains(@class,"article-label")]') as $headingNode) {
            $heading = $this->clean($headingNode->textContent);

            if ($heading === '' || !preg_match('/^day\s*\d/i', $heading)) {
                continue;
            }

            $number++;

            /* The timeline that follows this heading, and only this one. */
            $timeline = $xpath->query('following::ul[contains(@class,"timeline")][1]', $headingNode)->item(0);

            $title = null;
            $body = [];
            $stay = null;
            $meals = null;

            if ($timeline instanceof \DOMNode) {
                $title = $this->clean(
                    $xpath->query('.//div[contains(@class,"event-date")]//h3', $timeline)->item(0)?->textContent ?? '',
                ) ?: null;

                foreach ($xpath->query('.//div[contains(@class,"event-body")]//p', $timeline) as $paragraph) {
                    $text = $this->clean($paragraph->textContent);

                    if ($text !== '') {
                        $body[] = $text;
                    }
                }

                foreach ($xpath->query('.//ul[contains(@class,"aux-info-cells")]/li', $timeline) as $cell) {
                    $text = $this->clean($cell->textContent);
                    $icon = $xpath->query('.//i', $cell)->item(0);
                    $class = $icon instanceof \DOMElement ? $icon->getAttribute('class') : '';

                    if (str_contains($class, 'fa-home')) {
                        $stay = $text;
                    } elseif (str_contains($class, 'fa-cutlery')) {
                        $meals = $text;
                    }
                }
            }

            TourItineraryDay::create([
                'tour_id' => $tour->id,
                'day_number' => $number,
                'heading' => $heading,
                'title' => $title,
                'content' => implode("\n\n", $body),
                'stay' => $stay,
                'meals' => $meals,
                'display_order' => $number,
            ]);
        }
    }

    /**
     * What the price covers.
     *
     * The visa block uses the same `wp-block article list` markup as the
     * inclusions, so it arrives in this loop too — and it is not an inclusion,
     * it is the page's visa section. Told apart by the heading above it, and
     * put on the tour's own `visa_content` where it belongs.
     */
    private function importInclusions(Tour $tour, \DOMXPath $xpath): void
    {
        $order = 0;
        $visa = [];

        foreach ($xpath->query('//div[contains(@class,"wp-block") and contains(@class,"article")]') as $node) {
            $body = $this->clean(
                $xpath->query('.//div[contains(@class,"wp-block-body")]', $node)->item(0)?->textContent ?? '',
            );

            if (mb_strlen($body) < 20) {
                continue;
            }

            $heading = mb_strtolower($this->clean(
                $xpath->query('preceding::h3[contains(@class,"section-title")][1]', $node)->item(0)?->textContent ?? '',
            ));

            if (str_contains($heading, 'visa')) {
                $visa[] = $body;

                continue;
            }

            TourListItem::create([
                'tour_id' => $tour->id,
                'kind' => TourListItem::KIND_INCLUSION,
                'content' => $body,
                'display_order' => $order++,
            ]);
        }

        if ($visa !== []) {
            $tour->visa_content = implode("\n\n", $visa);
        }
    }

    /**
     * What the price does not cover — and, on some pages, what else shares the
     * same markup.
     *
     * `ul.recent` is the template's generic bullet list, so "What is excluded"
     * and "Special travel and health guidelines" are indistinguishable by class
     * alone. Spain-Portugal has both, which is how this was caught: sixteen
     * exclusions imported where the page shows twelve, the last four being
     * guidelines about walking pace and the autumn weather.
     *
     * So the heading above the list decides where its items go.
     */
    private function importExclusions(Tour $tour, \DOMXPath $xpath): void
    {
        $order = ['exclusion' => 0, 'guideline' => 0];

        foreach ($xpath->query('//ul[contains(@class,"recent")]') as $list) {
            $heading = $this->clean(
                $xpath->query('preceding::h3[contains(@class,"section-title")][1]', $list)->item(0)?->textContent ?? '',
            );

            $isGuidelines = $this->kindFor($heading) === TourBookingStep::KIND_GUIDELINES;

            foreach ($xpath->query('./li', $list) as $node) {
                $body = $this->clean($node->textContent);

                if (mb_strlen($body) < 15) {
                    continue;
                }

                if ($isGuidelines) {
                    $order['guideline']++;

                    TourBookingStep::create([
                        'tour_id' => $tour->id,
                        'kind' => TourBookingStep::KIND_GUIDELINES,
                        'step_number' => $order['guideline'],
                        'content' => $body,
                        'display_order' => $order['guideline'],
                    ]);

                    continue;
                }

                TourListItem::create([
                    'tour_id' => $tour->id,
                    'kind' => TourListItem::KIND_EXCLUSION,
                    'content' => $body,
                    'display_order' => $order['exclusion']++,
                ]);
            }
        }
    }

    /**
     * The numbered lists.
     *
     * Both "How to make booking" and "Documents required" are `ul.bullet` on
     * the old pages, distinguished only by the heading above them. So the
     * heading is what decides the kind.
     */
    private function importSteps(Tour $tour, \DOMXPath $xpath): void
    {
        foreach ($xpath->query('//ul[contains(@class,"bullet")]') as $list) {
            $heading = $this->clean(
                $xpath->query('preceding::h3[contains(@class,"section-title")][1]', $list)->item(0)?->textContent ?? '',
            );

            $kind = $this->kindFor($heading);
            $number = 0;

            foreach ($xpath->query('./li', $list) as $item) {
                $body = $this->clean(
                    $xpath->query('.//p', $item)->item(0)?->textContent ?? $item->textContent,
                );

                if ($body === '') {
                    continue;
                }

                $number++;

                TourBookingStep::create([
                    'tour_id' => $tour->id,
                    'kind' => $kind,
                    'step_number' => $number,
                    'content' => $body,
                    'display_order' => $number,
                ]);
            }
        }
    }

    private function kindFor(string $heading): string
    {
        $heading = mb_strtolower($heading);

        return match (true) {
            str_contains($heading, 'document') => TourBookingStep::KIND_DOCUMENTS,
            str_contains($heading, 'guideline'), str_contains($heading, 'health') => TourBookingStep::KIND_GUIDELINES,
            default => TourBookingStep::KIND_BOOKING,
        };
    }

    /* ------------------------------------------------------------- helpers */

    private function text(\DOMXPath $xpath, string $query): ?string
    {
        $node = $xpath->query($query)->item(0);

        return $node ? ($this->clean($node->textContent) ?: null) : null;
    }

    private function attr(\DOMXPath $xpath, string $query, ?string $attribute): ?string
    {
        $node = $xpath->query($query)->item(0);

        if (!$node instanceof \DOMElement) {
            return null;
        }

        $value = $attribute === null ? $node->textContent : $node->getAttribute($attribute);

        return $this->clean($value) ?: null;
    }

    /** Collapse the template's generous whitespace into readable text. */
    private function clean(string $value): string
    {
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return trim($value);
    }

    /**
     * Undo the mojibake in the source files.
     *
     * The pages were saved as UTF-8 from a Windows-1252 editor, so a single
     * character became two. Detected rather than assumed: a file that is clean
     * is left alone.
     */
    private function repairEncoding(string $html): string
    {
        if (!str_contains($html, 'â€') && !str_contains($html, 'Â')) {
            return $html;
        }

        $repaired = @mb_convert_encoding($html, 'ISO-8859-1', 'UTF-8');

        return $repaired !== false && $repaired !== '' ? $repaired : $html;
    }
}
