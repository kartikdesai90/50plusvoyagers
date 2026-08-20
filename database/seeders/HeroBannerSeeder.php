<?php

namespace Database\Seeders;

use App\Enums\SectionType;
use App\Models\HeroBanner;
use Illuminate\Database\Seeder;

/**
 * The homepage's bands, seeded with exactly what the approved design shows.
 *
 * The point is that the first dynamic render is identical to the static one it
 * replaces: same pictures, same words, same order. Anything else would be a
 * design change arriving disguised as a migration.
 *
 * Idempotent — these are the design's own content, not sample data, so running
 * it again updates the rows rather than duplicating the homepage.
 */
class HeroBannerSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->bands() as $order => $band) {
            HeroBanner::updateOrCreate(
                [
                    'section_type' => $band['section_type'],
                    'media_path' => $band['media_path'],
                ],
                [...$band, 'display_order' => $order, 'is_active' => true],
            );
        }
    }

    /**
     * The five hero slides and two banner bands the design ships with.
     *
     * `media_path` is a public path rather than an uploaded one: these files
     * are part of the build, so they need no upload to keep working.
     *
     * @return array<int, array<string, mixed>>
     */
    private function bands(): array
    {
        return [
            [
                'section_type' => SectionType::Hero,
                'media_path' => '/images/home/hero-mountain-lake.webp',
                'label' => 'Small-group travel for the 50+ explorer',
                // The asterisks are the one piece of formatting a heading may
                // carry; they set the brand italic the design puts on "mean".
                'heading' => 'See the world like you *mean* it.',
                'description' => 'Thoughtfully paced, expertly hosted journeys across India and the world, for people who are only just getting started.',
                'button_text' => 'Browse the trip calendar',
                'button_url' => '#trips',
                /* What the design printed over the photograph, which until now
                   was written into the front end and could not be edited. */
                'caption_label' => 'Our voyagers · out there with us',
                'caption_heading' => 'Travel together. Create stories that last.',
                'caption_text' => 'Small groups, unhurried days, and friendships that outlast the trip.',
                'caption_button_text' => 'Explore our journeys',
                'caption_button_url' => '#trips',
            ],
            [
                'section_type' => SectionType::Hero,
                'media_path' => '/images/home/pangong-lake.webp',
                'heading' => 'See the world like you *mean* it.',
            ],
            [
                'section_type' => SectionType::Hero,
                'media_path' => '/images/home/paro-valley.webp',
                'heading' => 'See the world like you *mean* it.',
            ],
            [
                'section_type' => SectionType::Hero,
                'media_path' => '/images/home/kerala-backwaters.webp',
                'heading' => 'See the world like you *mean* it.',
            ],
            [
                'section_type' => SectionType::Hero,
                'media_path' => '/images/home/cappadocia.webp',
                'heading' => 'See the world like you *mean* it.',
            ],

            [
                'section_type' => SectionType::Banner,
                'media_path' => '/images/home/divider-zanskar-rafting.webp',
                'heading' => 'Adventure never asks *how old* you are.',
                'description' => 'Rafting the Zanskar, ballooning over Cappadocia, standing on the equator. Our voyagers keep saying yes.',
                'button_text' => 'See where we go',
                'button_url' => '#trips',
            ],
            [
                'section_type' => SectionType::Banner,
                'media_path' => '/images/home/divider-kenya-equator.webp',
                'heading' => 'Everything sorted, *long before* you pack.',
                'description' => 'Visas, insurance, oxygen at altitude, the right chai stop. You just turn up and enjoy it.',
                'button_text' => 'How it works',
                'button_url' => '#why',
            ],
        ];
    }
}
