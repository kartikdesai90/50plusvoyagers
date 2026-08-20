<?php

namespace Database\Seeders;

use App\Enums\FeedbackType;
use App\Models\Feedback;
use App\Support\FileStore;
use Illuminate\Database\Seeder;

/**
 * The homepage's two feedback bands, seeded with exactly what the design shows.
 *
 * The point is that the first dynamic render is identical to the static one it
 * replaces: same words, same faces, same order, same card featured. Anything
 * else would be a design change arriving disguised as a migration.
 *
 * Idempotent — this is the design's own content, not sample data, so running it
 * again updates the rows rather than duplicating the section. The natural key is
 * the type and the traveller's name: two records of the same kind from the same
 * person are the same record, and an editor who reworded a quote keeps it.
 */
class FeedbackSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->feedback() as $order => $entry) {
            Feedback::updateOrCreate(
                [
                    'type' => $entry['type'],
                    'customer_name' => $entry['customer_name'],
                ],
                [...$entry, 'display_order' => $order, 'is_active' => true],
            );
        }
    }

    /**
     * The six written quotes and three films the design ships with.
     *
     * `photo_path` and `thumbnail_path` are public paths rather than uploaded
     * ones: these files are part of the build, so they need no upload to keep
     * working, and {@see FileStore::url()} passes them through
     * untouched.
     *
     * No `video_url` is set. The design ships the stills but not the films, and
     * a made-up address would be worse than an honest absence — the row renders
     * the card without making it a link until someone adds the real one.
     *
     * @return array<int, array<string, mixed>>
     */
    private function feedback(): array
    {
        return [
            [
                'type' => FeedbackType::Text,
                'customer_name' => 'Kamala Iyer, 71',
                'customer_location' => 'Bhutan: The Happy Kingdom · 2025',
                'feedback_text' => '“I put this trip off for fifteen years. I only wish I hadn’t waited. I’ve never felt more looked after, or more alive.”',
                'photo_path' => '/images/home/face-kamala.webp',
            ],
            [
                'type' => FeedbackType::Text,
                'customer_name' => 'Meera Nair, 63',
                'customer_location' => 'India Uncovered · 2025',
                'feedback_text' => '“From the first evening our tour manager made sure no one felt like the odd one out. At 63 I made friends I still call every week.”',
                'photo_path' => '/images/home/face-ranjini.webp',
            ],
            [
                'type' => FeedbackType::Text,
                'customer_name' => 'Prakash Rao, 68',
                'customer_location' => 'Spellbound in Ladakh · 2024',
                'feedback_text' => '“They handled the altitude, the oxygen, everything. All I did was gasp at Pangong Lake. Unforgettable at any age.”',
                'photo_path' => '/images/home/face-suresh.webp',
            ],
            [
                'type' => FeedbackType::Text,
                'customer_name' => 'Sulekha Patanka, 66',
                'customer_location' => 'Kerala: Hills, Backwaters & Coast · 2025',
                'feedback_text' => '“Eight days and not once did I feel rushed. The houseboat night alone was worth the whole trip.”',
                'photo_path' => '/images/home/face-harika.webp',
            ],
            [
                'type' => FeedbackType::Text,
                'customer_name' => 'Vijay Menon, 74',
                'customer_location' => 'Royal Rajasthan · 2024',
                'feedback_text' => '“I travel with a walking stick and a long list of tablets. Nobody made a fuss, and nobody left me behind.”',
                'photo_path' => '/images/home/face-malika.webp',
            ],
            [
                'type' => FeedbackType::Text,
                'customer_name' => 'Nirmala Reddy, 59',
                'customer_location' => 'Bhutan: The Happy Kingdom · 2024',
                'feedback_text' => '“I booked alone and came home with six friends. We already have next October in the diary.”',
                'photo_path' => '/images/home/face-kamala.webp',
            ],

            /*
             * Order is load-bearing here in a way it is not for the quotes: the
             * films row renders its featured card taller and centred, so the
             * featured one has to sit in the middle of the three.
             */
            [
                'type' => FeedbackType::Video,
                'customer_name' => 'Harika',
                'customer_location' => 'Retired architect · Bhutan ’24',
                'thumbnail_path' => '/images/home/face-harika.webp',
            ],
            [
                'type' => FeedbackType::Video,
                'customer_name' => 'Malika',
                'customer_location' => 'Grandmother of three · Rajasthan ’25',
                'thumbnail_path' => '/images/home/face-malika.webp',
                'is_featured' => true,
            ],
            [
                'type' => FeedbackType::Video,
                'customer_name' => 'Ranjini',
                'customer_location' => 'Former teacher · Kashmir ’25',
                'thumbnail_path' => '/images/home/face-ranjini.webp',
            ],
        ];
    }
}
