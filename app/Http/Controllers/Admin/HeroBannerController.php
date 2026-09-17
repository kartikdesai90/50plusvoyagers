<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SectionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHeroBannerRequest;
use App\Http\Requests\Admin\UpdateHeroBannerRequest;
use App\Http\Resources\Admin\HeroBannerResource;
use App\Models\HeroBanner;
use App\Support\FileStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * The homepage's hero slides and banner bands.
 *
 * Uploading is handled here rather than through a picture library, because
 * there is no library: a band's file has no life of its own, is used in exactly
 * one place, and is replaced by uploading another. Storing it beside the record
 * that uses it is what keeps that true.
 */
class HeroBannerController extends Controller
{
    /** Where uploads land on the disk. */
    private const FOLDER = 'hero-banners';

    public function __construct(private readonly FileStore $files) {}

    public function index(Request $request): JsonResponse
    {
        $bands = HeroBanner::query()
            ->when(
                $request->filled('section_type'),
                fn ($query) => $query->where('section_type', $request->string('section_type')->toString()),
            )
            ->orderBy('section_type')
            ->orderBy('display_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => HeroBannerResource::collection($bands),
            'meta' => [
                'sections' => array_map(fn (SectionType $type) => [
                    'value' => $type->value,
                    'label' => $type->label(),
                    // Said beside the field rather than inside the list, where
                    // there is no room for a sentence.
                    'description' => $type->description(),
                ], SectionType::cases()),
            ],
        ]);
    }

    public function show(HeroBanner $heroBanner): JsonResponse
    {
        return response()->json(['data' => new HeroBannerResource($heroBanner)]);
    }

    public function store(StoreHeroBannerRequest $request): JsonResponse
    {
        $band = new HeroBanner($request->bandAttributes());

        $file = $request->file('media_file');
        $band->media_path = $this->storeFile($file);

        $band->save();

        return response()->json(
            ['data' => new HeroBannerResource($band)],
            Response::HTTP_CREATED,
        );
    }

    /**
     * A new file replaces the old one, and the old one is removed.
     *
     * Deleting after the save rather than before it: if the save fails, the
     * record still points at a file that exists, which is a recoverable state.
     * The other order leaves a band pointing at nothing.
     */
    public function update(UpdateHeroBannerRequest $request, HeroBanner $heroBanner): JsonResponse
    {
        $previousPath = $heroBanner->media_path;
        $replacing = $request->hasFile('media_file');

        $heroBanner->fill($request->bandAttributes());

        if ($replacing) {
            $heroBanner->media_path = $this->storeFile($request->file('media_file'));
        }

        DB::transaction(fn () => $heroBanner->save());

        if ($replacing && $heroBanner->hasUploadedFile()) {
            $this->forgetFile($previousPath);
        }

        return response()->json(['data' => new HeroBannerResource($heroBanner->refresh())]);
    }

    public function destroy(HeroBanner $heroBanner): JsonResponse
    {
        $path = $heroBanner->media_path;
        $uploaded = $heroBanner->hasUploadedFile();

        $heroBanner->delete();

        if ($uploaded) {
            $this->forgetFile($path);
        }

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    private function storeFile(UploadedFile $file): string
    {
        return $this->files->put($file, self::FOLDER);
    }

    private function forgetFile(string $path): void
    {
        $this->files->forget($path);
    }
}
