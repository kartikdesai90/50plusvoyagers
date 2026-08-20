<?php

namespace App\Models;

use App\Support\FileStore;
use Illuminate\Database\Eloquent\Model;

/**
 * The homepage's "Why travel with us" band.
 *
 * A singleton, like the site settings. `current()` is the only way anything
 * should reach it and it always answers with a record — an unsaved one on a
 * site nobody has filled this band in on — so no caller has to decide what to
 * do about a null. Whether that record has ever been saved is what `exists`
 * says, and that is the one question the homepage asks before it decides
 * between the stored band and the one the design ships with.
 *
 * The band's title and the small line over it are not here. They are the
 * design's words rather than the business's, so they stay written into the
 * front end beside the layout they title. What this holds is what an editor
 * actually maintains.
 */
class WhyUsSection extends Model
{
    protected $fillable = [
        'points',
        'button_text',
        'button_url',
        'image_disk',
        'image_path',
        'caption_heading',
        'caption_text',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'points' => 'array',
        ];
    }

    /** Resolved once per request: the homepage and its editor both read this. */
    private static ?self $current = null;

    /**
     * The band.
     *
     * Always a record. On a site nobody has filled it in on that record is an
     * unsaved one with nothing on it, which is what a caller wants to receive —
     * the alternative is every reader repeating the same null check and one of
     * them eventually forgetting.
     */
    public static function current(): self
    {
        return self::$current ??= self::query()->orderBy('id')->first() ?? new self;
    }

    /** Only for tests and for the moment after a save, when it has changed. */
    public static function forget(): void
    {
        self::$current = null;
    }

    /**
     * Where a browser fetches the photograph from.
     *
     * Null where none has been chosen, which is the state a homepage falls back
     * out of rather than renders — an `img` with an empty `src` refetches the
     * page itself in some browsers.
     */
    public function imageUrl(): ?string
    {
        return app(FileStore::class)->url($this->image_disk, $this->image_path);
    }

    /**
     * The ticked list, in the order it was written, without the blank rows.
     *
     * A row an editor added and then left empty is somebody who changed their
     * mind, not a bullet with nothing in it — so it is dropped here rather than
     * rendered as a tick beside no words.
     *
     * @return array<int, string>
     */
    public function pointList(): array
    {
        $points = [];

        foreach ($this->points ?? [] as $point) {
            $point = trim((string) $point);

            if ($point === '') {
                continue;
            }

            $points[] = $point;
        }

        return $points;
    }

    /**
     * A button is only a button once it has both a word and a destination.
     * Rendering one without the other gives a visitor something to click that
     * goes nowhere, or a link with nothing to read.
     */
    public function hasButton(): bool
    {
        return filled($this->button_text) && filled($this->button_url);
    }

    /**
     * Whether there is anything to print over the photograph at all.
     *
     * A band with no caption written draws no caption, rather than an empty box
     * with a scrim over the picture.
     */
    public function hasCaption(): bool
    {
        return filled($this->caption_heading) || filled($this->caption_text);
    }

    /**
     * Whether this band is worth sending to the homepage.
     *
     * The photograph is what the design is built out of — the points, the
     * button and the caption are all things the band can do without, and its
     * heading was never this table's to begin with. Short of a picture the
     * front end is better off with what it ships with than with half a band.
     */
    public function isRenderable(): bool
    {
        return filled($this->imageUrl());
    }
}
