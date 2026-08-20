<?php

namespace Database\Seeders;

use App\Models\WhyUsSection;
use Illuminate\Database\Seeder;

/**
 * The "Why travel with us" band, seeded with exactly what the design already
 * says.
 *
 * These words were written into the front end — the four ticked points, the
 * button under them, the line printed over the photograph. Seeding them is what
 * makes the change invisible: the first render from the database is the same
 * band as the last render from the constants.
 *
 * The band's own heading and the small line over it are not seeded because they
 * are not stored. They are the design's words, and they stay in the front end.
 *
 * `image_path` is a public path rather than an uploaded one, the way the hero
 * bands carry theirs: the file is part of the build, so it needs no upload to
 * keep working and is never this application's to delete.
 *
 * Idempotent, and keyed on nothing at all: there is one of these bands by
 * definition, so this updates whichever row exists and creates it only when
 * none does. Running it again on a live site rewrites the band — which is worth
 * knowing before running it against words an editor has since changed by hand.
 */
class WhyUsSectionSeeder extends Seeder
{
    public function run(): void
    {
        $section = WhyUsSection::query()->orderBy('id')->first() ?? new WhyUsSection;

        $section->fill([
            'points' => [
                'Social connection happens naturally',
                'Comfortable pace, comfortable stays',
                "You're supported, never micromanaged",
                'Everything taken care of, end to end',
            ],

            'button_text' => 'See upcoming trips',
            'button_url' => '#trips',

            'image_path' => '/images/home/why-travellers-together.webp',

            /* The words the design prints over the bottom of that photograph. */
            'caption_heading' => 'Small groups of 12–16',
            'caption_text' => 'Big enough for friends, small enough that everyone belongs.',
        ]);

        $section->save();
    }
}
