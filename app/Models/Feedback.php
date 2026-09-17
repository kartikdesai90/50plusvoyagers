<?php

namespace App\Models;

use App\Enums\FeedbackType;
use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * What one traveller said about travelling with us.
 *
 * Written or filmed, it is one record. The model owns the two things nothing
 * outside it should work out for itself: how a stored file becomes an address
 * a browser can fetch, and where a film actually comes from when it may have
 * arrived as either a link or an upload.
 */
class Feedback extends Model
{
    /** Laravel would guess `feedbacks`, and there is no such word. */
    protected $table = 'feedback';

    protected $fillable = [
        'type',
        'customer_name',
        'customer_location',
        'feedback_text',
        'video_url',
        'video_path',
        'thumbnail_path',
        'photo_path',
        'rating',
        'tour_id',
        'is_featured',
        'is_active',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => FeedbackType::class,
            'rating' => 'integer',
            'tour_id' => 'integer',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    /**
     * What the public site shows, in the order it shows it.
     *
     * Both halves belong together: one switched off must disappear everywhere
     * at once, and "first" must mean the same thing to every caller.
     *
     * @param  Builder<static>  $query
     */
    public function scopeVisible(Builder $query, ?FeedbackType $type = null): void
    {
        $query->where('is_active', true)
            ->when($type !== null, fn (Builder $query) => $query->where('type', $type))
            ->orderBy('display_order')
            ->orderBy('id');
    }

    /** @param  Builder<static>  $query */
    public function scopeFeatured(Builder $query): void
    {
        $query->where('is_featured', true)->visible();
    }

    /**
     * Where the film is, whichever way it arrived.
     *
     * An uploaded file wins over a link: someone who uploads one after pasting
     * a link has replaced it, and the newer of the two is what they meant.
     */
    public function videoSource(): ?string
    {
        return $this->files()->url($this->video_path) ?? $this->video_url;
    }

    public function thumbnailUrl(): ?string
    {
        return $this->files()->url($this->thumbnail_path);
    }

    public function photoUrl(): ?string
    {
        return $this->files()->url($this->photo_path);
    }

    private function files(): FileStore
    {
        return app(FileStore::class);
    }
}
