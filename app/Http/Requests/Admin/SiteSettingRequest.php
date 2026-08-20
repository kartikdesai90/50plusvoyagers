<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * What the site's settings are, described once.
 *
 * There is no store and no update to tell apart here: the settings are one row
 * that is edited in place, so unlike every other module this is one request
 * class rather than an abstract pair.
 *
 * Almost everything is optional. A business without a LinkedIn account, a
 * second telephone line or a map link is an ordinary business, and a form that
 * insisted on all of them would be a form nobody could save. The one required
 * value is the name, because the footer's wordmark, the `og:site_name` and the
 * copyright line are all built out of it and there is nothing sensible to fall
 * back to.
 */
class SiteSettingRequest extends FormRequest
{
    private const MAX_IMAGE = 5 * 1024;

    private const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/svg+xml';

    /** A favicon may also be a real `.ico`, which is not an image mimetype. */
    private const ICON_TYPES = 'image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon';

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            /* ------------------------------------------------- contact */
            'company_name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            /*
             * Loose on purpose. Telephone numbers are written a dozen ways and
             * an editor typing the one their customers recognise must not be
             * argued with; the dialable link is derived from the digits, so
             * however it is punctuated the link still works.
             */
            'phone' => ['nullable', 'string', 'max:40'],
            'phone_alt' => ['nullable', 'string', 'max:40'],
            'whatsapp_number' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:500'],
            'map_url' => ['nullable', 'url', 'max:2048'],

            /* -------------------------------------------------- social */
            'facebook_url' => ['nullable', 'url', 'max:2048'],
            'instagram_url' => ['nullable', 'url', 'max:2048'],
            'youtube_url' => ['nullable', 'url', 'max:2048'],
            'linkedin_url' => ['nullable', 'url', 'max:2048'],
            'twitter_url' => ['nullable', 'url', 'max:2048'],
            'other_socials' => ['nullable', 'array', 'max:8'],
            'other_socials.*.label' => ['nullable', 'string', 'max:60'],
            'other_socials.*.url' => ['nullable', 'url', 'max:2048'],

            /* ------------------------------------------------- website */
            'logo_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],
            'logo_alt' => ['nullable', 'string', 'max:255'],
            'favicon_file' => ['nullable', 'file', 'mimetypes:'.self::ICON_TYPES, 'max:512'],
            'website_url' => ['nullable', 'url', 'max:2048'],

            /* ----------------------------------------------------- SEO */
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'og_image_file' => ['nullable', 'file', 'mimetypes:'.self::IMAGE_TYPES, 'max:'.self::MAX_IMAGE],

            /* -------------------------------------------------- footer */
            'copyright_text' => ['nullable', 'string', 'max:255'],
            'footer_description' => ['nullable', 'string', 'max:500'],
            'footer_links' => ['nullable', 'array', 'max:12'],
            'footer_links.*.label' => ['nullable', 'string', 'max:60'],
            'footer_links.*.url' => ['nullable', 'string', 'max:2048'],
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return [
            'company_name' => 'website name',
            'phone_alt' => 'second phone number',
            'whatsapp_number' => 'WhatsApp number',
            'map_url' => 'map link',
            'twitter_url' => 'X link',
            'logo_file' => 'logo',
            'logo_alt' => 'description of the logo',
            'favicon_file' => 'favicon',
            'og_image_file' => 'sharing image',
            'meta_title' => 'default search title',
            'meta_description' => 'default search description',
            'meta_keywords' => 'default keywords',
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'company_name.required' => 'The site needs a name — it appears in the footer and in search results.',
            'email.email' => 'That does not look like an email address.',
            'favicon_file.mimetypes' => 'A favicon must be a PNG, an SVG or an ICO file.',
            'favicon_file.max' => 'That favicon is too large. Please keep it under 512 KB.',
            'logo_file.max' => 'That logo is too large. Please keep it under 5 MB.',
            'og_image_file.max' => 'That sharing image is too large. Please keep it under 5 MB.',
        ];
    }

    /**
     * The record's own fields, without the files — those are handled
     * separately, because storing one can fail in ways a validated array cannot.
     *
     * @return array<string, mixed>
     */
    public function settingAttributes(): array
    {
        $validated = $this->validated();

        return [
            'company_name' => trim($validated['company_name']),
            'email' => $this->cleaned($validated['email'] ?? null),
            'phone' => $this->cleaned($validated['phone'] ?? null),
            'phone_alt' => $this->cleaned($validated['phone_alt'] ?? null),
            'whatsapp_number' => $this->cleaned($validated['whatsapp_number'] ?? null),
            'address' => $this->cleaned($validated['address'] ?? null),
            'map_url' => $this->cleaned($validated['map_url'] ?? null),

            'facebook_url' => $this->cleaned($validated['facebook_url'] ?? null),
            'instagram_url' => $this->cleaned($validated['instagram_url'] ?? null),
            'youtube_url' => $this->cleaned($validated['youtube_url'] ?? null),
            'linkedin_url' => $this->cleaned($validated['linkedin_url'] ?? null),
            'twitter_url' => $this->cleaned($validated['twitter_url'] ?? null),
            'other_socials' => $this->cleanPairs($validated['other_socials'] ?? []),

            'logo_alt' => $this->cleaned($validated['logo_alt'] ?? null),
            'website_url' => $this->cleaned($validated['website_url'] ?? null),

            'meta_title' => $this->cleaned($validated['meta_title'] ?? null),
            'meta_description' => $this->cleaned($validated['meta_description'] ?? null),
            'meta_keywords' => $this->cleaned($validated['meta_keywords'] ?? null),

            'copyright_text' => $this->cleaned($validated['copyright_text'] ?? null),
            'footer_description' => $this->cleaned($validated['footer_description'] ?? null),
            'footer_links' => $this->cleanPairs($validated['footer_links'] ?? []),
        ];
    }

    /**
     * Label-and-address pairs, with the half-finished ones dropped.
     *
     * A repeatable row an editor added and then left blank is not an error to
     * report, it is a row they changed their mind about — and a link with an
     * address but no words has nothing to render, so it goes the same way.
     *
     * @param  array<int, array<string, string|null>>  $pairs
     * @return array<int, array{label: string, url: string}>|null
     */
    private function cleanPairs(array $pairs): ?array
    {
        $cleaned = [];

        foreach ($pairs as $pair) {
            $label = trim((string) ($pair['label'] ?? ''));
            $url = trim((string) ($pair['url'] ?? ''));

            if ($label === '' || $url === '') {
                continue;
            }

            $cleaned[] = ['label' => $label, 'url' => $url];
        }

        return $cleaned === [] ? null : $cleaned;
    }

    private function cleaned(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
