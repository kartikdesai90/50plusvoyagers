<?php

namespace App\Http\Resources\Site;

use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The site's settings, as a visitor's browser receives them.
 *
 * Smaller than the admin's view of the same record and shaped differently: what
 * a page needs is a list of profiles it can draw and a set of addresses it can
 * point at, not the columns those were assembled from. So the social accounts
 * arrive as one already-ordered, already-labelled list, and the telephone
 * numbers arrive with the links already built — the markup should never be in
 * the business of turning `+91 74065 77905` into something dialable.
 *
 * Nothing here is guaranteed to be present. A field an editor left empty
 * arrives as null, and the front end falls back to what the design ships with.
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
            'email_href' => $this->emailHref(),
            'phone' => $this->phone,
            'phone_href' => $this->phoneHref(),
            'phone_alt' => $this->phone_alt,
            'phone_alt_href' => $this->phoneAltHref(),
            'whatsapp_href' => $this->whatsappHref(),
            'address' => $this->address,
            'map_url' => $this->map_url,

            /* Already ordered and already labelled: every page that shows these
               shows the same ones in the same order. */
            'socials' => $this->socialLinks(),

            'logo_url' => $this->logoUrl(),
            'logo_alt' => $this->logo_alt ?? '',
            'favicon_url' => $this->faviconUrl(),
            'website_url' => $this->website_url,

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords,
            'og_image_url' => $this->ogImageUrl(),

            /* Without the year: whoever renders this knows what year it is. */
            'copyright_text' => $this->copyrightLine(),
            'footer_description' => $this->footer_description,
            'footer_links' => $this->footerLinkList(),
        ];
    }
}
