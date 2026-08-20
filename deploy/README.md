# Running this application

Three supervised processes, one database, one filesystem disk. Nothing else.

| Process | Command | Why it must be supervised |
|---|---|---|
| Front end | `npm --prefix frontend run start` | serves every page a visitor or an editor sees |
| PHP application | your PHP-FPM / web server of choice | answers `/api`, and serves `/images` and `/storage` |
| Queue worker | `php artisan queue:work --tries=3` | image derivatives, mail and sitemap work is queued, never inline |

`supervisor/50plusvoyagers.conf` is a ready-to-adapt Supervisor configuration for
the front end and the queue worker. Both restart automatically: the front end
serves the whole site, so a crash that is not restarted is an outage rather than
a degradation.

## The two halves, and which one the world talks to

Next is in front. Every public URL and every `/admin` screen is a Next route, and
Next reaches Laravel for data. Laravel is not exposed directly — bind it to
`127.0.0.1` and let the front end be the only thing that can reach it.

`frontend/next.config.ts` forwards four things through to Laravel, and one of
them is load-bearing rather than convenient:

| Path | Why it is proxied |
|---|---|
| `/api/*` | the admin panel authenticates with a Laravel session cookie and a matching `XSRF-TOKEN`. Passing these through Next keeps the whole application on one origin, so the cookie stays same-site and the CSRF check keeps working. Calling Laravel on its own port would make both cross-site. |
| `/storage/*` | the pictures editors upload live on Laravel's disk |
| `/images/*` | the pictures shipped with the site live there too |
| `/favicon.ico`, `/robots.txt` | one source of truth per file |

Set `LARAVEL_ORIGIN` in the front end's environment to wherever Laravel is
listening, and `NEXT_PUBLIC_SITE_URL` to the site's real public address — the
second is what canonical and `og:url` tags are resolved against, so getting it
wrong points every page at the wrong host.

> **`LARAVEL_ORIGIN` is read at build time, not just at start time.** Next writes
> the resolved rewrite targets into `.next/routes-manifest.json` when it builds,
> so `next start` uses whatever address was set during `next build` and ignores a
> later change. Change it and you must rebuild — restarting is not enough. The
> symptom is a site whose pages all render but whose images and `/api` calls
> return 500 with `ECONNREFUSED` against the *old* address; confirm with:
>
> ```
> grep -o 'http://[^"]*' frontend/.next/routes-manifest.json | sort -u
> ```

## Scheduler

One cron entry, running as the application user:

```cron
* * * * * cd /path/to/50plusvoyagers && php artisan schedule:run >> /dev/null 2>&1
```

## Deploy order is load-bearing

```
1. php artisan migrate --force
2. npm --prefix frontend ci
3. npm --prefix frontend run build   # prerenders every public page
4. php artisan queue:restart
5. restart the front-end process     # it serves the build made in step 3
```

Step 3 before step 5, always. `next build` prerenders the public pages against
the API as it is at that moment, and restarting the front end before the build
exists serves the previous release's markup.

Step 1 before step 3 for the same reason in the other direction: the homepage is
prerendered from the database, so the schema has to be the new one by the time
the build reads it.

## Drivers

Cache, queue and sessions all run on the database driver, and uploads go to a
local filesystem disk. There is no Redis, no queue service and no search
service to install. Confirm with:

```
php artisan about --only=drivers
```

The database is PostgreSQL. `php artisan db:show` will say so, and will also say
how many tables it can see — a quick way to tell a fresh, unmigrated database
from a migrated one.

## When the API is unreachable

The homepage falls back to the content written into the front end, so a visitor
still gets a complete page rather than an empty one. That is deliberate, and it
is also why the failure is written to the front end's log with a
`[site] homepage content could not be fetched` line. Alert on it: a site quietly
serving placeholder content instead of what an editor published looks entirely
healthy from the outside.
