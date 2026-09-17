<?php

namespace App\Models;

use App\Enums\PostStatus;
use App\Support\FileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One journal post.
 *
 * The model owns three things nothing outside it should work out for itself:
 * where a stored picture is fetched from, what "published" actually means, and
 * how long the post takes to read.
 */
class BlogPost extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'image_path',
        'category',
        'tags',
        'author_id',
        'author_name',
        'meta_title',
        'meta_description',
        'canonical_url',
        'is_featured',
        'status',
        'published_at',
        'display_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'author_id' => 'integer',
            'is_featured' => 'boolean',
            'status' => PostStatus::class,
            'published_at' => 'datetime',
            'display_order' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Live, and only live.
     *
     * Published *and* the moment has passed: a future date is a post scheduled
     * to appear, not one that is already out. A listing that forgot the second
     * half of that condition would publish it early.
     *
     * @param  Builder<static>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', PostStatus::Published)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * The order a reader meets the journal in.
     *
     * Featured first, then whatever an editor arranged, then newest. Stated
     * here rather than at each call site because the index, the homepage row
     * and the "keep reading" strip must agree about which post leads — one of
     * them disagreeing would be a post that leads the index and is missing
     * from the homepage.
     *
     * @param  Builder<static>  $query
     */
    public function scopeInReadingOrder(Builder $query): void
    {
        $query->orderByDesc('is_featured')
            ->orderBy('display_order')
            ->orderByDesc('published_at')
            ->orderByDesc('id');
    }

    public function isLive(): bool
    {
        return $this->status === PostStatus::Published
            && $this->published_at !== null
            && $this->published_at->isPast();
    }

    /** Where a browser fetches the featured picture from. */
    public function imageUrl(): ?string
    {
        return app(FileStore::class)->url($this->image_path);
    }

    /**
     * Minutes to read, from the body's word count.
     *
     * Derived rather than typed: an editor asked to keep it accurate after
     * every edit would eventually stop, and a wrong one is worse than none.
     */
    public function readingMinutes(): int
    {
        $words = str_word_count(strip_tags((string) $this->content));

        return max(1, (int) ceil($words / 200));
    }

    /**
     * Whose name goes under the title.
     *
     * The credited writer first, because most of this journal is written by
     * members rather than by staff. Failing that the staff member who filed it,
     * and failing that the club — a byline is part of the design, so there is
     * always one rather than a gap where one should be.
     */
    public function bylineName(): string
    {
        return (string) ($this->author_name ?: $this->author?->name ?: '50+ Voyagers Team');
    }

    /**
     * The post as the paragraphs a reader is shown.
     *
     * The public article is a column of plain paragraphs, not a slot for
     * arbitrary markup: whatever an editor pasted, what leaves here is text.
     * Block endings become the breaks between paragraphs first, so a post
     * written as HTML does not arrive as one unbroken wall.
     *
     * @return array<int, string>
     */
    public function paragraphs(): array
    {
        $text = (string) $this->content;
        $text = preg_replace('#</(p|div|h[1-6]|li|blockquote|section|article)>#i', "\n\n", $text) ?? $text;
        $text = preg_replace('#<br\s*/?>#i', "\n", $text) ?? $text;
        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        $blocks = preg_split('/\R{2,}/', $text) ?: [];

        return array_values(array_filter(array_map('trim', $blocks), filled(...)));
    }

    /** Minutes to read, phrased the way the design prints it. */
    public function readingTime(): string
    {
        return $this->readingMinutes().' min read';
    }

    /** The date under the title, as a reader reads it rather than as ISO. */
    public function publishedOn(): string
    {
        return (string) $this->published_at?->format('j M Y');
    }

    /** Where this post lives on the public site. */
    public function publicPath(): string
    {
        return '/blog/'.ltrim((string) $this->slug, '/');
    }
}
