<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

/**
 * The site's settings, seeded with exactly what the design already says.
 *
 * These values were written into the front end — the telephone numbers in the
 * footer, the address under them, the name on the wordmark. Seeding them is
 * what makes the change invisible: the first render from the database is the
 * same page as the last render from the constants.
 *
 * Idempotent, and keyed on nothing at all: there is one settings row by
 * definition, so this updates whichever one exists and creates it only when
 * none does. Running it again on a live site rewrites the seeded fields and
 * leaves the rest — which is worth knowing before running it against settings
 * an editor has since changed by hand.
 */
class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = SiteSetting::query()->orderBy('id')->first() ?? new SiteSetting;

        $settings->fill([
            'company_name' => '50+ Voyagers',

            'email' => 'info@50plusvoyagers.com',
            'phone' => '+91 80957 73222',
            'phone_alt' => '+91 74065 77905',
            /* Stored as a number: the wa.me address is derived from it. */
            'whatsapp_number' => '+91 80957 73222',
            'address' => 'HSR Layout, Bengaluru, Karnataka, India',

            /*
             * The social accounts are deliberately left empty. The footer has
             * been pointing its Instagram and Facebook marks at the homepage
             * because the real handles were never confirmed, and a guessed
             * handle sends people to somebody else's page — which is worse than
             * a mark that is not drawn at all. They appear the day someone
             * types them into the settings screen.
             */

            'website_url' => 'https://50plusvoyagers.com',

            'meta_title' => '50+ Voyagers',
            'meta_description' => 'Travel experiences designed for voyagers over fifty.',
            'meta_keywords' => 'group tours for seniors, 50+ travel, small group travel India, senior travel club',

            'copyright_text' => '50+ Voyagers. Made for the explorer at heart.',
            'footer_description' => 'Thoughtfully paced, expertly hosted journeys across India and the world, for people who are only just getting started.',
        ]);

        $settings->save();
    }
}
