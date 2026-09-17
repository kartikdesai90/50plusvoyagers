<?php

namespace App\Models;

use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One card under "Who we are" on the homepage.
 *
 * Rows rather than a list on a singleton, because each card carries a
 * photograph and a photograph has to be replaceable on its own.
 *
 * The model owns the one thing nothing outside it should work out for itself:
 * how a stored file becomes an address a browser can fetch.
 */
class WhoWeAreCard extends Model
{
    protected $fillable = [
        'title',
        'body',
        'image_path',
        'is_active',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    /**
     * What the homepage shows, in the order it shows it.
     *
     * Both halves belong together: a card switched off must disappear
     * everywhere at once, and "first" must mean the same thing to every caller.
     *
     * @param  Builder<static>  $query
     */
    public function scopeVisible(Builder $query): void
    {
        $query->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('id');
    }

    public function imageUrl(): ?string
    {
        return app(FileStore::class)->url($this->image_path);
    }

    /**
     * What a screen reader announces.
     *
     * The card's own title. No description is stored beside the picture: an
     * editor who named the card has already described it, and asking them to
     * write it twice is how the second one ends up empty.
     */
    public function describedAs(): string
    {
        return (string) $this->title;
    }
}
