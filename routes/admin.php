<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BlogPostController;
use App\Http\Controllers\Admin\FeedbackController;
use App\Http\Controllers\Admin\GalleryItemController;
use App\Http\Controllers\Admin\HeroBannerController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\TourContentController;
use App\Http\Controllers\Admin\TourController;
use App\Http\Controllers\Admin\WhoWeAreCardController;
use App\Http\Controllers\Admin\WhyUsSectionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin API
|--------------------------------------------------------------------------
|
| The admin panel is a client-rendered SPA that talks JSON, so its endpoints
| live here rather than being Inertia pages. They use session-cookie auth, so
| they need the `web` middleware group's session and CSRF handling — which is
| why this file is required from `web.php` rather than registered as an API.
|
| Required before `site.php` and long before the SPA catch-all: order is what
| stops a later, broader route from swallowing these.
|
| Signing in and out, and nothing else. There is deliberately no registration
| route: an admin account is created by seeding, and business modules are not
| part of this foundation.
|
*/

Route::prefix('api/admin')->name('admin.api.')->group(function () {
    // Lets the SPA (re)prime the XSRF-TOKEN cookie before a state-changing
    // request, so a long-idle tab does not fail its first POST with a 419.
    Route::get('csrf-cookie', fn () => response()->noContent())->name('csrf-cookie');

    Route::post('login', [AuthController::class, 'store'])->name('login');

    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('me', [AuthController::class, 'show'])->name('me');
        Route::post('logout', [AuthController::class, 'destroy'])->name('logout');

        /*
         * The homepage's hero slides and banner bands.
         *
         * The update is a POST rather than a PATCH on purpose: it can carry a
         * replacement file, and a multipart body cannot be read from a PATCH
         * by PHP. The intent travels in `_method` for anything that inspects
         * it, and the route stays honest about what it accepts.
         */
        Route::get('hero-banners', [HeroBannerController::class, 'index'])->name('hero-banners.index');
        Route::post('hero-banners', [HeroBannerController::class, 'store'])->name('hero-banners.store');
        Route::get('hero-banners/{hero_banner}', [HeroBannerController::class, 'show'])->name('hero-banners.show');
        Route::post('hero-banners/{hero_banner}', [HeroBannerController::class, 'update'])->name('hero-banners.update');
        Route::delete('hero-banners/{hero_banner}', [HeroBannerController::class, 'destroy'])->name('hero-banners.destroy');

        /*
         * What travellers said. One module for both the written quotes and the
         * filmed ones — the update is a POST for the same reason as above.
         */
        Route::get('feedback', [FeedbackController::class, 'index'])->name('feedback.index');
        Route::post('feedback', [FeedbackController::class, 'store'])->name('feedback.store');
        Route::get('feedback/{feedback}', [FeedbackController::class, 'show'])->name('feedback.show');
        Route::post('feedback/{feedback}', [FeedbackController::class, 'update'])->name('feedback.update');
        Route::delete('feedback/{feedback}', [FeedbackController::class, 'destroy'])->name('feedback.destroy');

        /*
         * The two homepage bands an editor maintains the content of rather than
         * the words that title them: the "Who we are" cards, and the points and
         * photograph under "Why travel with us". One screen edits both, in two
         * tabs, but each tab saves on its own — so they are two pairs of
         * endpoints rather than one that has to be told which half it is for.
         *
         * Two each, not five: neither is a list an editor browses. The cards
         * are saved as a set, and the band is one row edited in place.
         */
        Route::get('who-we-are', [WhoWeAreCardController::class, 'index'])->name('who-we-are.index');
        Route::post('who-we-are', [WhoWeAreCardController::class, 'update'])->name('who-we-are.update');

        Route::get('why-us', [WhyUsSectionController::class, 'show'])->name('why-us.show');
        Route::post('why-us', [WhyUsSectionController::class, 'update'])->name('why-us.update');

        /*
         * Everything about the site that is true on every page of it.
         *
         * Two endpoints, not five: the settings are one row edited in place, so
         * there is nothing to list, create or delete. The save is a POST for the
         * same reason as the modules above — it can carry a replacement logo.
         */
        Route::get('settings', [SiteSettingController::class, 'show'])->name('settings.show');
        Route::post('settings', [SiteSettingController::class, 'update'])->name('settings.update');

        /* Photographs from the road. Pictures only. */
        Route::get('gallery', [GalleryItemController::class, 'index'])->name('gallery.index');
        Route::post('gallery', [GalleryItemController::class, 'store'])->name('gallery.store');
        Route::get('gallery/{gallery}', [GalleryItemController::class, 'show'])->name('gallery.show');
        Route::post('gallery/{gallery}', [GalleryItemController::class, 'update'])->name('gallery.update');
        Route::delete('gallery/{gallery}', [GalleryItemController::class, 'destroy'])->name('gallery.destroy');

        /* The journal. */
        Route::get('blog', [BlogPostController::class, 'index'])->name('blog.index');
        Route::post('blog', [BlogPostController::class, 'store'])->name('blog.store');
        Route::get('blog/{blog}', [BlogPostController::class, 'show'])->name('blog.show');
        Route::post('blog/{blog}', [BlogPostController::class, 'update'])->name('blog.update');
        Route::delete('blog/{blog}', [BlogPostController::class, 'destroy'])->name('blog.destroy');

        /*
         * The group tours.
         *
         * Five endpoints, because this is a list an editor browses and adds to
         * rather than a fixed band saved whole.
         *
         * The update is a POST like every other module's, though this one
         * carries no file and PUT would describe it better. Consistency wins:
         * one rule for how the panel saves is worth more than one endpoint
         * being technically tidier than its neighbours, and the day a tour
         * carries a photograph this needs no change.
         */
        Route::get('tours', [TourController::class, 'index'])->name('tours.index');
        Route::post('tours', [TourController::class, 'store'])->name('tours.store');
        Route::get('tours/{tour}', [TourController::class, 'show'])->name('tours.show');
        Route::post('tours/{tour}', [TourController::class, 'update'])->name('tours.update');
        Route::delete('tours/{tour}', [TourController::class, 'destroy'])->name('tours.destroy');

        /*
         * A tour's repeating blocks — the day-by-day, the highlights, what the
         * price covers and what it does not.
         *
         * Two endpoints, because the lists are read as a group and written as a
         * group. Separate from the tour's own save because they are a separate
         * sitting: correcting a tour code takes a moment, writing thirteen days
         * does not — and because folding them in would let a screen that showed
         * only some of the lists blank the ones it never displayed.
         */
        Route::get('tours/{tour}/content', [TourContentController::class, 'show'])->name('tours.content.show');
        Route::post('tours/{tour}/content', [TourContentController::class, 'update'])->name('tours.content.update');
    });
});
