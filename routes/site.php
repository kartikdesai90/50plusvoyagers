<?php

use App\Http\Controllers\Site\BlogController;
use App\Http\Controllers\Site\HomeController;
use App\Http\Controllers\Site\SettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Site API
|--------------------------------------------------------------------------
|
| What the public site needs from the database, as JSON.
|
| These used to be Inertia pages: Laravel matched the visitor's URL, rendered a
| React component and returned finished markup. The front end is a Next
| application now, so the URLs belong to it and this file answers only the part
| Laravel still owns — the data.
|
| The homepage and the journal have content here. Tours, the workshop list and
| the legal text are still written into the front end, exactly as they were, so
| there is nothing here for them to ask for. Each one earns an endpoint on the
| day its content moves into the database, and not before.
|
| The journal's address is `blog`, matching the URL a reader sees, rather than
| the model's own word for it — an endpoint named after the page it fills is one
| less thing to translate when something goes wrong.
|
| No session or CSRF concerns: this is read-only and public. It sits under the
| `web` group with the admin API for one reason — one place where "the API" is
| registered is easier to keep in order than two.
|
*/

Route::prefix('api/site')->name('site.api.')->group(function () {
    /*
     * What is true on every page: how to reach the business, where to find it,
     * and what a search engine is told when a page says nothing of its own.
     * Its own endpoint rather than a corner of the homepage's, because every
     * page needs it and only one page needs that one.
     */
    Route::get('settings', SettingsController::class)->name('settings');

    Route::get('home', HomeController::class)->name('home');

    Route::get('blog', [BlogController::class, 'index'])->name('blog.index');
    /*
     * Constrained to the shape a slug actually has, so a request for something
     * that could never be an address is refused by the router rather than
     * becoming a query that finds nothing.
     */
    Route::get('blog/{slug}', [BlogController::class, 'show'])
        ->where('slug', '[a-z0-9]+(?:-[a-z0-9]+)*')
        ->name('blog.show');
});
