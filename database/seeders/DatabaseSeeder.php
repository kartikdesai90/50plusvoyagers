<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Every seeder here is idempotent, because these are fixed reference sets
     * rather than sample data — running them again on a live database must
     * update the rows, never duplicate them.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            SiteSettingSeeder::class,
            HeroBannerSeeder::class,
            WhoWeAreCardSeeder::class,
            WhyUsSectionSeeder::class,
            FeedbackSeeder::class,
            GalleryItemSeeder::class,
            BlogPostSeeder::class,
            TourSeeder::class,
            CrmDepartureSeeder::class,
        ]);
    }
}
