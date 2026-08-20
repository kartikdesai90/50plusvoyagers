<?php

namespace App\Models;

use App\Enums\SectionType;
use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * One band of the homepage — a hero slide, or a full-width banner.
 *
 * A band shows a picture. It used to be able to show a film instead, which is
 * why the columns are still called `media_*` rather than `image_*` — renaming
 * them would be a migration that changed nothing about what the site does.
 *
 * The model owns one thing the rest of the application must never work out for
 * itself: how a stored file becomes an address a browser can fetch. Nothing
 * outside {@see mediaUrl()} may touch `media_disk` or `media_path`, which is
 * what keeps moving to object storage or a CDN a configuration change.
 */
class HeroBanner extends Model
{
    protected $fillable = [
        'section_type',
        'media_disk',
        'media_path',
        'label',
        'heading',
        'description',
        'button_text',
        'button_url',
        'caption_label',
        'caption_heading',
        'caption_text',
        'caption_button_text',
        'caption_button_url',
        'is_active',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'section_type' => SectionType::class,
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    /**
     * What the homepage shows, in the order it shows it.
     *
     * Both halves matter and they belong together: a band switched off must
     * disappear everywhere at once, and "first" must mean the same thing to
     * every caller. Splitting the condition would eventually leave one read
     * path showing something another had hidden.
     *
     * @param  Builder<static>  $query
     */
    public function scopeVisible(Builder $query, SectionType $section): void
    {
        $query->where('section_type', $section)
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('id');
    }

    /**
     * Where a browser fetches this file from.
     *
     * A path that already starts with a slash is served straight out of the
     * public directory — that is how the images shipped with the design are
     * carried, and they need no upload to keep working. Anything else was
     * uploaded and lives on a disk.
     */
    public function mediaUrl(): string
    {
        return app(FileStore::class)->url($this->media_disk, $this->media_path) ?? '';
    }

    /** True where the file was uploaded rather than shipped with the design. */
    public function hasUploadedFile(): bool
    {
        return !Str::startsWith($this->media_path, ['/', 'http://', 'https://']);
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

    /** The same rule, for the link in the corner of the photograph. */
    public function hasCaptionButton(): bool
    {
        return filled($this->caption_button_text) && filled($this->caption_button_url);
    }

    /**
     * Whether there is anything to print over the photograph at all.
     *
     * A hero with no caption written draws no caption, rather than an empty
     * box with a scrim over the picture.
     */
    public function hasCaption(): bool
    {
        return filled($this->caption_label)
            || filled($this->caption_heading)
            || filled($this->caption_text)
            || $this->hasCaptionButton();
    }
}
