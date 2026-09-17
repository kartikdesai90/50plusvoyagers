<?php

namespace App\Models;

use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One photograph.
 *
 * This is the only table of pictures. A tour's carousel used to be a second one
 * — `tour_images` — which meant the same photograph filed twice, described
 * twice and ordered twice; four of the five pictures in the build existed in
 * both. A carousel is now simply the rows carrying that tour's id.
 *
 * `is_active` decides what reaches the public gallery, and it still does for a
 * tour's photographs: they appear on the wall like any other, and an editor
 * switches off the ones that should not.
 *
 * The model owns the one thing nothing outside it should work out for itself:
 * how a stored file becomes an address a browser can fetch.
 */
class GalleryItem extends Model
{
    protected $fillable = [
        'title',
        'caption',
        'alt',
        'image_path',
        'tour_id',
        'is_featured',
        'is_cover',
        'is_active',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'tour_id' => 'integer',
            'is_featured' => 'boolean',
            'is_cover' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    /**
     * What a public gallery shows, in the order it shows it.
     *
     * Both halves belong together: one switched off must disappear everywhere
     * at once, and "first" must mean the same thing to every caller.
     *
     * @param  Builder<static>  $query
     */
    public function scopeVisible(Builder $query): void
    {
        $query->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('id');
    }

    /** @param  Builder<static>  $query */
    public function scopeFeatured(Builder $query): void
    {
        $query->where('is_featured', true)->visible();
    }

    /**
     * One tour's carousel, in the editor's order.
     *
     * Deliberately not `visible()`. A photograph switched off is off the public
     * gallery, and that is what the flag is for — but the cover of a tour page
     * is page furniture, and hiding it from the wall should not empty the
     * carousel it leads.
     *
     * @param  Builder<static>  $query
     */
    public function scopeForTour(Builder $query, int $tourId): void
    {
        $query->where('tour_id', $tourId)
            ->orderByDesc('is_cover')
            ->orderBy('display_order')
            ->orderBy('id');
    }

    /** @return BelongsTo<Tour, $this> */
    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class);
    }

    public function imageUrl(): string
    {
        return app(FileStore::class)->url($this->image_path) ?? '';
    }

    /**
     * What a screen reader announces.
     *
     * The written description where there is one, the caption or the title
     * otherwise. `alt` is nullable on purpose: an editor who wrote a caption has
     * already described the picture, and asking for it twice is how the second
     * one ends up empty — or worse, contradicting the first. The field exists
     * for the tour pages, where the description and the caption are genuinely
     * different sentences.
     */
    public function describedAs(): string
    {
        return (string) ($this->alt ?: $this->caption ?: $this->title);
    }
}
