<?php

namespace App\Models;

use App\Support\CrmDepartures;
use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

/**
 * One group tour — the CRM's record of it, and the page it has.
 *
 * Two things live side by side here and it is worth being clear which is which.
 * `tour_code` and `tour_name` identify the page and join it to the CRM.
 * Everything else stored here is the page: its address, its prose, its meta
 * tags, its photographs.
 *
 * Price, dates, nights, category, deposit and whether the tour is live
 * (`tour_status`) are read live from `tb_group_tour` through
 * {@see CrmDepartures}, because a copy of a price is a price that can be wrong.
 *
 * Testimonials are not a relation defined here either — they are `feedback`
 * rows carrying this tour's id, and that module already owns them.
 */
class Tour extends Model
{
    /** @var list<array<string, mixed>>|null */
    private ?array $cachedDepartures = null;

    protected $fillable = [
        'tour_code',
        'tour_name',

        // The page.
        'slug',
        'page_title',
        'subtitle',
        'summary',
        'ribbon_text',
        'route_map_path',
        'image_path',
        'visa_content',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_title',
        'og_description',
        'og_image_path',
        'canonical_url',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'display_order' => 'integer',
        ];
    }

    /* ---------------------------------------------------------------- lists */

    /**
     * This tour's photographs, cover first.
     *
     * `gallery_items` rather than a carousel table of its own: that table
     * already carried a `tour_id`, and keeping a second one meant the same
     * picture filed twice with two captions free to drift apart.
     *
     * Not filtered by `is_active`. That flag decides what reaches the public
     * gallery wall; a tour's own page shows the pictures filed against it
     * either way, so hiding one from the wall does not empty the carousel.
     *
     * @return HasMany<GalleryItem, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(GalleryItem::class)
            ->orderByDesc('is_cover')
            ->orderBy('display_order')
            ->orderBy('id');
    }

    /**
     * The bullets under the opening prose.
     *
     * Constrained to its `kind` rather than being a table of its own: the
     * highlights and the exclusions are the same shape and share
     * `tour_list_items`. Every caller still asks for `highlights`, so what
     * changed is where they are stored, not how they are read.
     *
     * @return HasMany<TourListItem, $this>
     */
    public function highlights(): HasMany
    {
        return $this->hasMany(TourListItem::class)
            ->where('kind', TourListItem::KIND_HIGHLIGHT);
    }

    /** @return HasMany<TourItineraryDay, $this> */
    public function itineraryDays(): HasMany
    {
        return $this->hasMany(TourItineraryDay::class);
    }

    /**
     * What the price covers.
     *
     * The middle third of `tour_list_items`. See {@see highlights()}.
     *
     * @return HasMany<TourListItem, $this>
     */
    public function inclusions(): HasMany
    {
        return $this->hasMany(TourListItem::class)
            ->where('kind', TourListItem::KIND_INCLUSION);
    }

    /**
     * What the price does not cover.
     *
     * The last third of `tour_list_items`. See {@see highlights()}.
     *
     * @return HasMany<TourListItem, $this>
     */
    public function exclusions(): HasMany
    {
        return $this->hasMany(TourListItem::class)
            ->where('kind', TourListItem::KIND_EXCLUSION);
    }

    /** @return HasMany<TourBookingStep, $this> */
    public function bookingSteps(): HasMany
    {
        return $this->hasMany(TourBookingStep::class);
    }

    /**
     * What travellers said about this tour.
     *
     * The existing Feedback module, filtered — not a table of its own. Those
     * rows already carry a `tour_id`, and they come with the approval step a
     * public page needs.
     *
     * @return HasMany<Feedback, $this>
     */
    public function testimonials(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    /* --------------------------------------------------------------- scopes */

    /**
     * The tours the public site may show.
     *
     * A page needs an address: a tour recorded from the CRM but never written
     * has nothing to render. Whether the departure is live is
     * `tb_group_tour.tour_status`, not a second flag on this table.
     *
     * @param  Builder<static>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->whereNotNull('slug')
            ->orderBy('display_order')
            ->orderBy('id');
    }

    /**
     * The order a list of tours is read in, in the admin.
     *
     * Soonest-ending first, using the CRM's `tour_end_date`.
     *
     * A tour with no matching CRM row sorts last rather than first. Nulls
     * lead an ascending sort on both MySQL and SQLite, which would float
     * every unmatched row to the top of the screen, so the null check leads
     * the sort.
     *
     * Matched on the whole `tour_code` rather than the destination stem: the
     * list is ordered, not joined for display, and an exact code is portable
     * across engines. The public page still matches on the stem through
     * {@see CrmDepartures}.
     *
     * @param  Builder<static>  $query
     */
    public function scopeSoonest(Builder $query): void
    {
        if (! Schema::hasTable('tb_group_tour')) {
            $query->orderBy('id');

            return;
        }

        $endDate = '(select min(tour_end_date) from tb_group_tour'
            .' where trim(tb_group_tour.tour_code) = trim(tours.tour_code))';

        $query->orderByRaw($endDate.' is null')
            ->orderByRaw($endDate)
            ->orderBy('id');
    }

    /* ------------------------------------------------------------- the page */

    /**
     * The heading the page carries.
     *
     * The page's own H1 where one was written, the CRM's name otherwise. They
     * are different things and both are right for their own job: `tour_name` is
     * "Coorg 30 May - 2 June 2026", a departure; the H1 is "Coorg - The Coffee
     * Capital of India", a place.
     */
    public function heading(): string
    {
        return $this->page_title ?: (string) $this->tour_name;
    }

    /**
     * What the CRM knows about this tour's departures, soonest first.
     *
     * Read on demand rather than eager-loaded: it crosses to another database,
     * and the pages that need it ask for it once.
     *
     * @return list<array<string, mixed>>
     */
    public function departures(): array
    {
        return $this->cachedDepartures ??= app(CrmDepartures::class)->forKey($this->crmMatchKey());
    }

    /**
     * The soonest live CRM departure, which is what a card and a price panel
     * quote.
     *
     * @return array<string, mixed>|null
     */
    public function nextDeparture(): ?array
    {
        return $this->departures()[0] ?? null;
    }

    /**
     * India / International, as the public site already labels it.
     *
     * The CRM stores `Domestic` or `International` in `tour_category`. The
     * listing filter and the fact strip say India, so the mapping lives here
     * rather than in every resource.
     */
    public function publicRegion(): ?string
    {
        $category = mb_strtolower(trim((string) ($this->nextDeparture()['category'] ?? '')));

        return match ($category) {
            'domestic', 'india' => 'India',
            'international' => 'International',
            '' => null,
            default => (string) $this->nextDeparture()['category'],
        };
    }

    /**
     * The booking deposit, from the CRM's `tour_advance`.
     *
     * Null when none is set, so the panel can hide the line rather than print
     * a zero rupee fee.
     */
    public function publicBookingFee(): ?int
    {
        $advance = (int) ($this->nextDeparture()['advance'] ?? 0);

        return $advance > 0 ? $advance : null;
    }

    /**
     * The stem of the CRM's tour code — 'Coorg' from 'Coorg30052026'.
     *
     * This is the join. It is a stem rather than the whole code because one
     * page serves many departures: the CRM has two July departures that both
     * point at `jog.html`.
     */
    public function crmMatchKey(): string
    {
        // Everything up to the first digit, which is where the date begins.
        return trim(preg_split('/\d/', trim((string) $this->tour_code))[0] ?? '');
    }

    public function routeMapUrl(): ?string
    {
        return app(FileStore::class)->url($this->route_map_path);
    }

    /**
     * The tour's own main picture.
     *
     * Null where none has been chosen, which is what lets a card and a page
     * fall back to the carousel's cover — a tour photographed before anybody
     * set a lead image keeps the picture it already showed.
     */
    public function imageUrl(): ?string
    {
        return app(FileStore::class)->url($this->image_path);
    }

    public function ogImageUrl(): ?string
    {
        return app(FileStore::class)->url($this->og_image_path);
    }

    /**
     * What a screen reader and a search engine are told, when nobody wrote
     * anything specific.
     *
     * The fallbacks live here rather than in the front end so that the page,
     * the card and the sitemap cannot each invent a different one.
     */
    public function metaTitle(): string
    {
        return $this->meta_title ?: $this->heading();
    }

    public function metaDescription(): ?string
    {
        return $this->meta_description ?: $this->summary;
    }
}
