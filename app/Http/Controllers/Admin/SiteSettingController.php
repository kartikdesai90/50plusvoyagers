<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SiteSettingRequest;
use App\Http\Resources\Admin\SiteSettingResource;
use App\Models\SiteSetting;
use App\Support\FileStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;

/**
 * Everything about the site that is true on every page of it.
 *
 * Two endpoints, not five. The settings are one row that is edited in place:
 * there is nothing to list, nothing to create and nothing to delete, and a
 * module that offered those would be offering an editor the chance to leave
 * the site with no settings at all.
 *
 * The save is a POST rather than a PATCH for the same reason as every other
 * module here: it can carry replacement files, and PHP will not parse a
 * multipart body from any other method.
 */
class SiteSettingController extends Controller
{
    private const FOLDER = 'site';

    /**
     * The three pictures the settings hold, and the pair of columns each is
     * stored in. Written once so adding a fourth is one line rather than three
     * near-identical blocks of replace-then-forget.
     */
    private const IMAGES = [
        'logo_file' => ['logo_disk', 'logo_path'],
        'favicon_file' => ['favicon_disk', 'favicon_path'],
        'og_image_file' => ['og_image_disk', 'og_image_path'],
    ];

    public function __construct(private readonly FileStore $files) {}

    public function show(): JsonResponse
    {
        return response()->json(['data' => new SiteSettingResource(SiteSetting::current())]);
    }

    /**
     * Save them.
     *
     * `current()` hands back an unsaved record on a site nobody has configured
     * yet, so the first save creates the row and every one after it updates the
     * same row — without this endpoint needing to know which of those it is
     * doing, and without any way for a second row to appear.
     *
     * Old files are deleted after the save rather than before it. If the save
     * fails the record still points at files that exist, which is recoverable;
     * the other order leaves a logo pointing at nothing.
     */
    public function update(SiteSettingRequest $request): JsonResponse
    {
        $settings = SiteSetting::current();

        $replaced = [];

        foreach (self::IMAGES as $field => [$diskColumn, $pathColumn]) {
            $file = $request->file($field);

            if (!$file instanceof UploadedFile) {
                continue;
            }

            $replaced[] = [$settings->{$diskColumn}, $settings->{$pathColumn}];

            $settings->{$diskColumn} = $this->files->disk();
            $settings->{$pathColumn} = $this->files->put($file, self::FOLDER);
        }

        $settings->fill($request->settingAttributes());
        $settings->save();

        foreach ($replaced as [$disk, $path]) {
            $this->files->forget($disk, $path);
        }

        /* The settings are read once per request and cached for it; this one
           has just changed them. */
        SiteSetting::forget();

        return response()->json(['data' => new SiteSettingResource($settings->fresh())]);
    }
}
