<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\Site\GalleryItemResource;
use App\Models\GalleryItem;
use Illuminate\Http\JsonResponse;

/**
 * Every photograph, for the gallery page.
 *
 * Its own endpoint rather than a larger slice of the homepage's. The homepage
 * asks for eight because it is a band on a page about something else; the
 * gallery is the page, and raising that limit to serve both would send every
 * photograph on the site to render a strip of eight.
 *
 * Unpaginated, matching the journal index and for the same reason: this is a
 * club's photographs, counted in dozens, and the page shows them as one grid
 * with a lightbox over it. Paging a grid that short would cost a round trip to
 * see pictures the visitor came for. If it ever grows past a few hundred, the
 * fix is to page it here — the resource and the page would not change.
 */
class GalleryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        /*
         * `visible` is the same scope the homepage reads through, which is what
         * makes "switched off" mean one thing everywhere: a photograph an editor
         * hides leaves both places at once, and "first" is the order they set
         * rather than whichever row the database handed back.
         */
        $photos = GalleryItem::query()->visible()->get();

        return response()->json([
            'photos' => GalleryItemResource::collection($photos)->resolve(),
        ]);
    }
}
