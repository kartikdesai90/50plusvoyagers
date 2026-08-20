<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Laravel serves no HTML any more. Every address a visitor or an editor types
| belongs to the Next application, which renders the public site on its server
| and the admin panel in the browser, and reaches back here for data.
|
| What is left is the API, in two files with two different jobs:
|
|   admin.php   session-authenticated, read and write, the panel's whole surface
|   site.php    public, read-only, what the homepage needs from the database
|
| `admin.php` stays first. Order was load-bearing when a catch-all could swallow
| these; the catch-all is gone with the SPA shell it served, but the two files
| are still read in the order that made sense and there is no reason to disturb
| it.
|
| Both are required from here rather than registered as an API precisely because
| the admin panel authenticates with a session cookie: it needs the `web`
| middleware group's session handling and CSRF verification, which the `api`
| group does not have.
|
*/

require __DIR__.'/admin.php';
require __DIR__.'/site.php';
