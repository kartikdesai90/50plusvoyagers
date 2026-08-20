<?php

namespace App\Http\Resources\Admin;

use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The site's settings as their editor sees them.
 *
 * The disk and the stored path never leave the server — an editor works with a
 * picture they can see, and where the bytes live is the application's business.
 * The derived links travel too, so the screen can show what an address will
 * actually resolve to without rebuilding the rule in the browser.
 *
 * @mixin SiteSetting
 */
class SiteSettingResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'company_name' => $this->company_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'phone_alt' => $this->phone_alt,
            'whatsapp_number' => $this->whatsapp_number,
            'address' => $this->address,
            'map_url' => $this->map_url,

            'facebook_url' => $this->facebook_url,
            'instagram_url' => $this->instagram_url,
            'youtube_url' => $this->youtube_url,
            'linkedin_url' => $this->linkedin_url,
            'twitter_url' => $this->twitter_url,
            'other_socials' => $this->other_socials ?? [],

            'logo_url' => $this->logoUrl(),
            'logo_alt' => $this->logo_alt,
            'favicon_url' => $this->faviconUrl(),
            'website_url' => $this->website_url,

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'og_image_url' => $this->ogImageUrl(),

            'copyright_text' => $this->copyright_text,
            'footer_description' => $this->footer_description,
            'footer_links' => $this->footer_links ?? [],

            /* Derived, so the screen can show the editor what it resolved to. */
            'whatsapp_href' => $this->whatsappHref(),
            'phone_href' => $this->phoneHref(),
            'email_href' => $this->emailHref(),

            /* Null on a site nobody has configured yet — the record is real
               but has never been saved, and the screen says so. */
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
