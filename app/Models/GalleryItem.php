<?php

namespace App\Models;

use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One photograph in the gallery.
 *
 * The model owns the one thing nothing outside it should work out for itself:
 * how a stored file becomes an address a browser can fetch.
 */
class GalleryItem extends Model
{
    protected $fillable = [
        'title',
        'caption',
        'image_disk',
        'image_path',
        'tour_id',
        'is_featured',
        'is_active',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'tour_id' => 'integer',
            'is_featured' => 'boolean',
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

    public function imageUrl(): string
    {
        return app(FileStore::class)->url($this->image_disk, $this->image_path) ?? '';
    }

    /**
     * What a screen reader announces.
     *
     * The caption, or failing that the title. No description is stored beside
     * the picture: an editor who wrote a caption has already described it, and
     * asking them to write it twice is how the second one ends up empty — or
     * worse, contradicting the first.
     */
    public function describedAs(): string
    {
        return (string) ($this->caption ?: $this->title);
    }
}
