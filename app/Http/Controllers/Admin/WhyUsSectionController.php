<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\WhyUsSectionRequest;
use App\Http\Resources\Admin\WhyUsSectionResource;
use App\Models\WhyUsSection;
use App\Support\FileStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;

/**
 * The homepage's "Why travel with us" band.
 *
 * Two endpoints, not five, for the reason the settings have two: this is one
 * row that is edited in place. There is nothing to list, nothing to create and
 * nothing to delete — a module that offered those would be offering an editor
 * the chance to leave the homepage with a hole in it.
 *
 * The save is a POST rather than a PATCH for the same reason as every other
 * module here: it can carry a replacement photograph, and PHP will not parse a
 * multipart body from any other method.
 */
class WhyUsSectionController extends Controller
{
    private const FOLDER = 'why-us';

    public function __construct(private readonly FileStore $files) {}

    public function show(): JsonResponse
    {
        return response()->json(['data' => new WhyUsSectionResource(WhyUsSection::current())]);
    }

    /**
     * Save it.
     *
     * `current()` hands back an unsaved record on a site where this band has
     * never been filled in, so the first save creates the row and every one
     * after it updates the same row — without this endpoint needing to know
     * which of those it is doing, and without any way for a second row to
     * appear and start competing for the same position on the page.
     *
     * The old photograph is deleted after the save rather than before it. If
     * the save fails the record still points at a file that exists, which is
     * recoverable; the other order leaves the band pointing at nothing.
     */
    public function update(WhyUsSectionRequest $request): JsonResponse
    {
        $section = WhyUsSection::current();

        $file = $request->file('image_file');
        $replacing = $file instanceof UploadedFile;
        $previous = [$section->image_disk, $section->image_path];

        $section->fill($request->whyUsAttributes());

        if ($replacing) {
            $section->image_disk = $this->files->disk();
            $section->image_path = $this->files->put($file, self::FOLDER);
        }

        $section->save();

        if ($replacing) {
            $this->files->forget($previous[0], $previous[1]);
        }

        /* Read once per request and cached for it; this one has just changed it. */
        WhyUsSection::forget();

        return response()->json(['data' => new WhyUsSectionResource($section->fresh())]);
    }
}
