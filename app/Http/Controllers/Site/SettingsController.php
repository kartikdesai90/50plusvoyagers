<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\Site\SiteSettingResource;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;

/**
 * What is true on every page of the site.
 *
 * How to reach the business, where to find it, what it is called, and what a
 * search engine is told when a page says nothing of its own. Its own endpoint
 * rather than a corner of the homepage's: every page needs this, and only one
 * page needs the homepage's bands.
 *
 * Answers on a site nobody has configured yet too — `current()` hands back an
 * empty record rather than nothing, so the response is the same shape either
 * way and the front end falls back field by field to what the design ships
 * with. A settings endpoint that 404'd until someone had visited the admin
 * would be an endpoint the footer had to be defensive about twice.
 */
class SettingsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        /*
         * Resolved to a plain array rather than handed over as a resource: a
         * resource serialises itself inside a `data` envelope, and the front
         * end would be unwrapping one to reach a footer's telephone number.
         */
        return response()->json(
            (new SiteSettingResource(SiteSetting::current()))->resolve()
        );
    }
}
