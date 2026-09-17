<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\WhoWeAreCardsRequest;
use App\Http\Resources\Admin\WhoWeAreCardResource;
use App\Models\WhoWeAreCard;
use App\Support\FileStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * The four "Who we are" cards on the homepage.
 *
 * Two endpoints, not five, though this is a table of rows rather than a
 * singleton: the cards are read as a group and are written as a group. A save
 * is a save of the whole set — what arrives is what the band becomes, and a
 * card that has been taken out of it is taken off the page.
 *
 * That is what settles the ordering without an editor typing numbers into it:
 * a card's position in the payload is its position on the homepage.
 */
class WhoWeAreCardController extends Controller
{
    private const FOLDER = 'who-we-are';

    public function __construct(private readonly FileStore $files) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => WhoWeAreCardResource::collection(
                WhoWeAreCard::query()->orderBy('display_order')->orderBy('id')->get()
            ),
        ]);
    }

    /**
     * Save the set.
     *
     * In a transaction because it is one change to one band, made out of
     * several writes — an editor who reordered three cards and removed a fourth
     * must not be able to end up with half of that, least of all on a page
     * visitors are reading while it happens.
     *
     * Files are deleted only once the transaction has committed. If it rolls
     * back the rows still point at pictures that exist, which is recoverable;
     * the other order leaves the homepage pointing at nothing.
     */
    public function update(WhoWeAreCardsRequest $request): JsonResponse
    {
        /** @var list<array{0: ?string, 1: ?string}> $discard */
        $discard = [];

        DB::transaction(function () use ($request, &$discard) {
            $stored = $request->storedCards();
            $kept = [];

            foreach ($request->cardSet() as $index => $card) {
                $model = $card['id'] !== null
                    ? $stored->get($card['id']) ?? new WhoWeAreCard
                    : new WhoWeAreCard;

                $model->fill($card['attributes']);

                if ($file = $request->file("cards.{$index}.image_file")) {
                    if ($file instanceof UploadedFile) {
                        /* The one it is replacing, once the save has held. */
                        $discard[] = $model->image_path;

                        $model->image_path = $this->files->put($file, self::FOLDER);
                    }
                }

                $model->save();
                $kept[] = $model->id;
            }

            /* Everything the editor took out of the band. */
            foreach ($stored as $card) {
                if (in_array($card->id, $kept, true)) {
                    continue;
                }

                $discard[] = $card->image_path;
                $card->delete();
            }
        });

        foreach ($discard as $path) {
            $this->files->forget($path);
        }

        return response()->json([
            'data' => WhoWeAreCardResource::collection(
                WhoWeAreCard::query()->orderBy('display_order')->orderBy('id')->get()
            ),
        ]);
    }
}
