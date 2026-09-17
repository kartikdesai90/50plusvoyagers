<?php

namespace Database\Seeders;

use App\Models\GalleryItem;
use Illuminate\Database\Seeder;

/**
 * The gallery, seeded with exactly what the approved design shows.
 *
 * The point is that the first dynamic render is identical to the static one it
 * replaces: same photographs, same words, same order. Anything else would be a
 * design change arriving disguised as a migration.
 *
 * Idempotent — these are the design's own content, not sample data, so running
 * it again updates the rows rather than filling the gallery twice.
 */
class GalleryItemSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->photographs() as $order => $photograph) {
            GalleryItem::updateOrCreate(
                ['image_path' => $photograph['image_path']],
                [...$photograph, 'display_order' => $order, 'is_active' => true],
            );
        }
    }

    /**
     * The four photographs the design ships with.
     *
     * `image_path` is a public path rather than an uploaded one: these files
     * are part of the front end's build, so they need no upload to keep
     * working, and `FileStore` hands a path like this straight back.
     *
     * @return array<int, array<string, mixed>>
     */
    private function photographs(): array
    {
        return [
            [
                'title' => 'Pangong Lake, Ladakh',
                'caption' => 'Ancient blue water, thin mountain air, and a group that laughed through every switchback.',
                'image_path' => '/images/home/pangong-lake.webp',
            ],
            [
                'title' => 'Paro Valley, Bhutan',
                'caption' => 'We climbed slowly to Tiger’s Nest and toasted at the top. No one left behind.',
                'image_path' => '/images/home/paro-valley.webp',
            ],
            [
                'title' => 'Kerala Backwaters',
                'caption' => 'Houseboats, coconut breeze, and the kind of quiet you feel in your chest.',
                'image_path' => '/images/home/kerala-backwaters.webp',
            ],
            [
                'title' => 'Cappadocia, Türkiye',
                'caption' => 'Up before dawn for a sky full of balloons. Worth every early morning.',
                'image_path' => '/images/home/cappadocia.webp',
            ],
        ];
    }
}
