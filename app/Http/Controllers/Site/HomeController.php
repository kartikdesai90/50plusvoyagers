<?php

namespace App\Http\Controllers\Site;

use App\Enums\FeedbackType;
use App\Enums\SectionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Site\BlogPostCardResource;
use App\Http\Resources\Site\FeedbackResource;
use App\Http\Resources\Site\GalleryItemResource;
use App\Http\Resources\Site\HeroBannerResource;
use App\Http\Resources\Site\WhoWeAreCardResource;
use App\Http\Resources\Site\WhyUsSectionResource;
use App\Models\BlogPost;
use App\Models\Feedback;
use App\Models\GalleryItem;
use App\Models\HeroBanner;
use App\Models\WhoWeAreCard;
use App\Models\WhyUsSection;
use Illuminate\Http\JsonResponse;

/**
 * The homepage's content.
 *
 * Its hero slides, banner bands and traveller feedback come from the database.
 * Everything else the homepage renders is still written into the front end, and
 * moving each of those across is its own piece of work.
 *
 * This used to hand the same four sets to an Inertia page. It now answers with
 * JSON, and the front end fetches it while rendering the page on the server —
 * so the four sets are still inside the markup of the first response, which was
 * always the point. A page that fetched them after boot would be a page whose
 * main image no crawler ever sees, and that is as true of Next as it was of the
 * SSR sidecar.
 */
class HomeController extends Controller
{
    public function __invoke(): JsonResponse
    {
        /*
         * Resolved to plain arrays rather than handed over as resource
         * collections: a collection serialises itself inside a `data` envelope,
         * which would leave the page unwrapping four envelopes before it could
         * render its own hero.
         */
        $why = WhyUsSection::current();

        return response()->json([
            'hero' => HeroBannerResource::collection(
                HeroBanner::query()->visible(SectionType::Hero)->get()
            )->resolve(),
            'banners' => HeroBannerResource::collection(
                HeroBanner::query()->visible(SectionType::Banner)->get()
            )->resolve(),

            /*
             * The cards under "Who we are". Only the cards: the words that
             * title that section are the design's rather than the business's,
             * so they stay in the front end beside the layout they title.
             */
            'values' => WhoWeAreCardResource::collection(
                WhoWeAreCard::query()->visible()->get()
            )->resolve(),

            /*
             * The "Why travel with us" band — again only what an editor
             * maintains, which here is the points, the photograph and the words
             * over it. Null rather than a half-filled object where nobody has
             * written one: a band with points and no photograph would be a
             * worse homepage than the fallback, not a more up-to-date one.
             *
             * Every other key here is a set, and empty is how a set says the
             * same thing. This one is a single band, so it says it with a null.
             */
            'why' => $why->isRenderable() ? (new WhyUsSectionResource($why))->resolve() : null,

            /*
             * Two queries rather than one grouped in PHP. They fill two separate
             * bands of the page, each with its own limit, and the index the
             * table carries is on `type` first — so asking twice is both the
             * clearer read and the one the database is built for.
             */
            'toasts' => FeedbackResource::collection(
                Feedback::query()->visible(FeedbackType::Text)->get()
            )->resolve(),
            'films' => FeedbackResource::collection(
                Feedback::query()->visible(FeedbackType::Video)->get()
            )->resolve(),

            /*
             * Both of the sets below are capped, and the caps are facts about
             * the design rather than about the data.
             *
             * The gallery is a grid that fills the width and then wraps, so it
             * survives any number — but a homepage is not the gallery, and an
             * editor who files forty photographs should not find the homepage
             * has become forty photographs. Eight is two full rows.
             */
            'gallery' => GalleryItemResource::collection(
                GalleryItem::query()->visible()->limit(8)->get()
            )->resolve(),

            /*
             * Three, because the journal row is three cards across and a fourth
             * would start a second row of one. The whole journal is a click
             * away on the index; this band is the invitation to it.
             */
            'articles' => BlogPostCardResource::collection(
                BlogPost::query()->published()->inReadingOrder()->with('author:id,name')->limit(3)->get()
            )->resolve(),
        ]);
    }
}
