<?php

namespace App\Models;

use App\Support\FileStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Everything about the site that is true on every page of it.
 *
 * A singleton. `current()` is the only way anything should reach it, and it
 * always answers with a record — an unsaved one on a site nobody has configured
 * yet — so no caller has to decide what to do about a null. Every field on that
 * empty record is null, and every reader of this model already has to handle
 * null because a business without a LinkedIn account is an ordinary business.
 *
 * The model owns the things nothing outside it should work out for itself: how
 * a stored file becomes an address, how a telephone number becomes a link a
 * browser can dial, and what a WhatsApp address looks like.
 */
class SiteSetting extends Model
{
    protected $fillable = [
        'company_name',
        'email',
        'phone',
        'phone_alt',
        'whatsapp_number',
        'address',
        'map_url',

        'facebook_url',
        'instagram_url',
        'youtube_url',
        'linkedin_url',
        'twitter_url',
        'other_socials',

        'logo_disk',
        'logo_path',
        'logo_alt',
        'favicon_disk',
        'favicon_path',
        'website_url',

        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image_disk',
        'og_image_path',

        'copyright_text',
        'footer_description',
        'footer_links',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'other_socials' => 'array',
            'footer_links' => 'array',
        ];
    }

    /** Resolved once per request: every page that renders reads this. */
    private static ?self $current = null;

    /**
     * The site's settings.
     *
     * Always a record. On a site nobody has configured yet that record is an
     * unsaved one with nothing on it, which is exactly what a caller wants to
     * receive — every field is optional, so "not configured" and "configured
     * with nothing in that box" are the same answer and need the same handling.
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

    /* ------------------------------------------------------------- files */

    public function logoUrl(): ?string
    {
        return app(FileStore::class)->url($this->logo_disk, $this->logo_path);
    }

    public function faviconUrl(): ?string
    {
        return app(FileStore::class)->url($this->favicon_disk, $this->favicon_path);
    }

    public function ogImageUrl(): ?string
    {
        return app(FileStore::class)->url($this->og_image_disk, $this->og_image_path);
    }

    /* ------------------------------------------------------------- links */

    /**
     * The telephone number as something a browser will dial.
     *
     * Derived rather than stored, so an editor types the number the way they
     * want it read and the link is correct regardless of the spaces, brackets
     * and dashes they used to make it readable.
     */
    public function phoneHref(): ?string
    {
        return $this->dialable($this->phone);
    }

    public function phoneAltHref(): ?string
    {
        return $this->dialable($this->phone_alt);
    }

    public function emailHref(): ?string
    {
        return filled($this->email) ? 'mailto:'.$this->email : null;
    }

    /**
     * The WhatsApp address, built from the number.
     *
     * `wa.me` wants digits and nothing else — no plus, no spaces — and an
     * editor pasting a whole address is how a chat link ends up pointing at
     * somebody else. So the number is what is stored and this is derived.
     */
    public function whatsappHref(): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $this->whatsapp_number);

        return filled($digits) ? 'https://wa.me/'.$digits : null;
    }

    /**
     * Every social profile that has an address, in the order the design shows
     * them, each already labelled.
     *
     * Assembled here rather than in the resource because the footer, the
     * contact page and anything else that grows one all want the same list, and
     * a second copy of this would be a second place for a network to go missing.
     *
     * @return array<int, array{platform: string, label: string, url: string}>
     */
    public function socialLinks(): array
    {
        $known = [
            'instagram' => ['Instagram', $this->instagram_url],
            'facebook' => ['Facebook', $this->facebook_url],
            'youtube' => ['YouTube', $this->youtube_url],
            'linkedin' => ['LinkedIn', $this->linkedin_url],
            'twitter' => ['X', $this->twitter_url],
            'whatsapp' => ['WhatsApp', $this->whatsappHref()],
        ];

        $links = [];

        foreach ($known as $platform => [$label, $url]) {
            if (blank($url)) {
                continue;
            }

            $links[] = ['platform' => $platform, 'label' => $label, 'url' => (string) $url];
        }

        /* Anything else the business is on, drawn with a generic mark. */
        foreach ($this->other_socials ?? [] as $extra) {
            if (blank($extra['url'] ?? null)) {
                continue;
            }

            $links[] = [
                'platform' => 'link',
                'label' => (string) ($extra['label'] ?? $extra['url']),
                'url' => (string) $extra['url'],
            ];
        }

        return $links;
    }

    /**
     * The footer's own links, as pairs the markup can render without checking.
     *
     * @return array<int, array{label: string, url: string}>
     */
    public function footerLinkList(): array
    {
        $links = [];

        foreach ($this->footer_links ?? [] as $link) {
            if (blank($link['url'] ?? null) || blank($link['label'] ?? null)) {
                continue;
            }

            $links[] = ['label' => (string) $link['label'], 'url' => (string) $link['url']];
        }

        return $links;
    }

    /**
     * The line after the ©, without the year.
     *
     * The year is deliberately not stored and not added here: whoever renders
     * this knows what year it is, and a year written into a database is a year
     * that is wrong every January.
     */
    public function copyrightLine(): string
    {
        return (string) ($this->copyright_text ?: $this->company_name);
    }

    private function dialable(?string $number): ?string
    {
        if (blank($number)) {
            return null;
        }

        $cleaned = preg_replace('/[^\d+]/', '', $number);

        return filled($cleaned) ? 'tel:'.Str::start(ltrim($cleaned, '+'), '+') : null;
    }
}
