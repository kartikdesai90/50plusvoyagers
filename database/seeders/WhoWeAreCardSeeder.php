<?php

namespace Database\Seeders;

use App\Models\WhoWeAreCard;
use Illuminate\Database\Seeder;

/**
 * The four "Who we are" cards, seeded with exactly what the design shows.
 *
 * The point is that the first dynamic render is identical to the static one it
 * replaces: same pictures, same words, same order. Anything else would be a
 * design change arriving disguised as a migration.
 *
 * `image_path` is a public path rather than an uploaded one: these files are
 * part of the build, so they need no upload to keep working.
 *
 * Idempotent, keyed on the picture each card carries — these are the design's
 * own content rather than sample data, so running it again updates the four
 * rows rather than giving the homepage eight cards.
 */
class WhoWeAreCardSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->cards() as $order => $card) {
            WhoWeAreCard::updateOrCreate(
                ['image_path' => $card['image_path']],
                [...$card, 'display_order' => $order, 'is_active' => true],
            );
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function cards(): array
    {
        return [
            [
                'title' => 'Small groups',
                'body' => "12–16 fellow travellers, never a faceless crowd. You'll know everyone's name by day two.",
                'image_path' => '/images/home/value-small-groups.webp',
            ],
            [
                'title' => 'Unhurried pace',
                'body' => 'Comfortable stays and time to actually savour a place, not sprint through it.',
                'image_path' => '/images/home/value-unhurried-pace.webp',
            ],
            [
                'title' => 'Fully hosted',
                'body' => 'A dedicated tour manager handles the logistics, so all you carry is your curiosity.',
                'image_path' => '/images/home/value-fully-hosted.webp',
            ],
            [
                'title' => 'Kindred company',
                'body' => "Everyone's in the same season of life: same stories, same spirit, same sense of adventure.",
                'image_path' => '/images/home/value-kindred-company.webp',
            ],
        ];
    }
}
