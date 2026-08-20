# Deploying to Render

A start-to-finish guide for this application on [Render](https://render.com).
Read the two constraints below before you begin — both shape the whole deploy,
and neither is something you can work around later.

---

## Two things to know first

**1. Render has no native PHP runtime.** Node, Python, Ruby, Go, Rust and Elixir
are the entire list; PHP is only supported through Docker. So the Laravel half of
this application ships as a container, and the Next.js half uses the native Node
runtime with no Docker at all. That split is not a preference — it is the only
arrangement Render allows.

**2. You chose the free plan, and it loses uploaded images.** Free instances have
an ephemeral filesystem. Editor-uploaded images live on Laravel's local disk
(`storage/app/public`, via `App\Support\FileStore`), so **every redeploy, restart
and wake-from-idle wipes them.** The 23 images in `public/images` are in git and
survive; anything uploaded through the admin panel does not. Three other free-tier
limits matter just as much:

| Limit | Effect here |
|---|---|
| Web services spin down after 15 min idle | first visit after a quiet spell takes ~1 min |
| 750 instance hours/month | two always-on free services exceed this; spin-down is what keeps you under |
| Free Postgres expires 30 days after creation | 1 GB cap, no backups; the database goes away |
| No background workers, no cron, no pre-deploy | the queue worker and scheduler cannot run |
| No SSH/Shell access | you cannot run `artisan` by hand — see step 4 |
| No private services | Laravel gets a public URL instead of hiding behind Next |

On that last one: the admin write endpoints in `routes/admin.php` are behind auth
and admin middleware, so a public API URL is not an open door. But it does mean
the read-only endpoints in `routes/site.php` are reachable directly, and that the
site answers on two origins — which is worth closing on a paid plan by making
Laravel a private service.

This is a fine shape for evaluating the deploy. It is not a shape for real
content. "[Going to production](#going-to-production)" at the end lists exactly
what to change.

---

## What gets created

| Render service | This repo | Runtime | Purpose |
|---|---|---|---|
| `50plusvoyagers-web` | `frontend/` | Node 22 | Next.js. **The only public thing.** |
| `50plusvoyagers-api` | repo root | Docker | Laravel: `/api`, `/images`, `/storage` |
| `50plusvoyagers-queue` | repo root | Docker | `queue:work` — *paid only* |
| `50plusvoyagers-cron` | repo root | Docker | `schedule:run` — *paid only* |
| `50plusvoyagers-db` | — | Postgres 16 | the database |

Next sits in front and Laravel sits behind it. Every public URL and every
`/admin` screen is a Next route; Next reaches Laravel for data and proxies
`/api`, `/storage`, `/images`, `/favicon.ico` and `/robots.txt` through to it
(`frontend/next.config.ts`). That proxy is load-bearing, not convenient: the
admin panel authenticates with a Laravel session cookie and a matching
`XSRF-TOKEN`, and routing both through one origin is what keeps those cookies
same-site and the CSRF check working.

---

## Files this adds

Committed already, nothing to write yourself:

```
Dockerfile                      php 8.3 + nginx + php-fpm, with pdo_pgsql and GD
.dockerignore                   keeps vendor/, frontend/ and .env out of the image
render.yaml                     UNUSED on free — Blueprints are paid. See step 3.
deploy/render/nginx.conf        serves public/, passes .php to php-fpm
deploy/render/php.ini           opcache, 32M uploads
deploy/render/supervisord.conf  runs nginx and php-fpm as one container
deploy/render/entrypoint.sh     port substitution, caches, migrations
```

One source change was also required — `bootstrap/app.php` now trusts Render's
proxy. Behind Render's TLS edge PHP receives plain HTTP, and only the
`X-Forwarded-*` headers reveal the request arrived over HTTPS. Without trusting
them Laravel builds `http://` URLs and marks the session cookie insecure, which
breaks exactly the admin-panel cookie auth described above.

---

## Step 1 — Push to a Git remote

Render deploys from GitHub, GitLab or Bitbucket. This working copy is not a git
repository yet, so create one:

```bash
cd d:/laragon/www/50plusvoyagers
git init
git add .
git commit -m "Add Render deployment configuration"
git branch -M main
git remote add origin https://github.com/<you>/50plusvoyagers.git
git push -u origin main
```

`.gitignore` already excludes `.env`, `vendor/`, `node_modules/` and
`frontend/.next`. Confirm your real `.env` is not staged before the first push —
it holds credentials and must never reach the remote:

```bash
git status --short | grep -E "^\S+\s+\.env$" && echo "STOP: .env is staged"
```

Also consider removing `_reverted.zip` (12 MB) from the repo root; it is not
ignored and will otherwise be committed and uploaded on every build.

## Step 2 — Generate an APP_KEY

Laravel refuses to boot without one. Generate it now and keep it somewhere safe —
you will paste it into Render, and it must never be committed:

```bash
php artisan key:generate --show
```

That prints something like `base64:xxxxxxxx…`. Copy the whole string including
the `base64:` prefix.

> On this machine, use Laragon's PHP 8.3 rather than the one on `PATH`:
> `/d/laragon/bin/php/php-8.3.30-Win32-vs16-x64/php.exe artisan key:generate --show`

## Step 3 — Create the three resources by hand

**Blueprints are a paid feature, so ignore `render.yaml` entirely.** It is kept
in the repo because it documents the intended shape and becomes usable the moment
you upgrade — but nothing below reads it. Create each resource from the dashboard
instead. The `Dockerfile` and `deploy/render/` configs do all the real work and
are used either way.

Create them in this order — the database first, because the other two need its
connection string.

### 3a — PostgreSQL

**New → Postgres.**

| Field | Value |
|---|---|
| Name | `50plusvoyagers-db` |
| Database | `fifty_plus_voyagers` |
| User | `voyagers` |
| Region | **pick one and use it for everything** |
| Version | 16 |
| Instance type | **Free** |

When it finishes provisioning, copy the **Internal Database URL** from its page.
Internal, not external: it is faster, free of egress charges, and does not cross
the public internet.

### 3b — Laravel (Docker)

**New → Web Service** → connect your repo.

| Field | Value |
|---|---|
| Name | `50plusvoyagers-api` |
| Language / Runtime | **Docker** |
| Branch | `main` |
| Root directory | *leave blank* — the Dockerfile is at the repo root |
| Dockerfile path | `./Dockerfile` |
| Instance type | **Free** |
| Health check path | `/up` |

Then add the environment variables under **Advanced → Add Environment Variable**:

| Key | Value |
|---|---|
| `APP_NAME` | `50 Plus Voyagers` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | the `base64:…` string from step 2 |
| `APP_URL` | `https://placeholder` — step 5 fixes it |
| `DB_CONNECTION` | `pgsql` |
| `DB_URL` | the **Internal Database URL** from 3a |
| `RUN_MIGRATIONS` | `true` |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `sync` |
| `FILESYSTEM_DISK` | `local` |
| `LOG_CHANNEL` | `stack` |
| `LOG_LEVEL` | `warning` |
| `MAIL_MAILER` | `log` |
| `ADMIN_EMAIL` | your admin login |
| `ADMIN_PASSWORD` | **a real password**, not `password` |

`DB_URL` is the name Laravel reads — Render's own field is called
`DATABASE_URL`, and pasting it under that name leaves Laravel unable to find the
database. `QUEUE_CONNECTION` is `sync` rather than `database` because there is no
worker on the free plan; see [Going to production](#going-to-production).

The first build takes several minutes — it compiles PHP extensions.

### 3c — Next.js

**New → Web Service** → the same repo.

| Field | Value |
|---|---|
| Name | `50plusvoyagers-web` |
| Language / Runtime | **Node** |
| Branch | `main` |
| **Root directory** | **`frontend`** |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm run start -- --port $PORT` |
| Instance type | **Free** |

Environment variables:

| Key | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `LARAVEL_ORIGIN` | `https://placeholder` — step 5 fixes it |
| `NEXT_PUBLIC_SITE_URL` | `https://placeholder` — step 5 fixes it |
| `NEXT_PUBLIC_APP_NAME` | `50 Plus Voyagers` |
| `NEXT_PUBLIC_API_BASE_URL` | `/api` |

Setting **Root directory** to `frontend` is what makes this a Node service rather
than a Docker one — Render looks for `package.json` there. Leave it blank and it
finds the `Dockerfile` at the root and builds the wrong half of the application.

`--include=dev` in the build command is equally load-bearing. Render sets
`NODE_ENV=production`, which makes `npm ci` skip `devDependencies` — but Tailwind,
PostCSS and TypeScript all live there and are all needed to *build*. Without the
flag the build dies on `Cannot find module '@tailwindcss/postcss'`. They belong
in `devDependencies`: the compiled output needs none of them at run time, only
the compiler does.

> **The first deploy is expected to be partly broken.** Two of those variables
> are URLs of services that did not exist when you typed them. Step 5 is the fix,
> and it is not optional.

## Step 4 — Confirm the database and schema

Migrations run automatically. `deploy/render/entrypoint.sh` runs
`php artisan migrate --force --isolated` on start, gated behind `RUN_MIGRATIONS`,
which you set to `true` in step 3b. The gate exists because the worker and cron
you may add later run this same image, and three containers migrating one
database at once half-applies a schema — so only ever set it on the web service.

Render's `preDeployCommand` is the proper home for migrations, but it is a paid
feature, so on free the start command is the only available hook.

Watch the API service's **Logs** tab for `==> Running migrations`, followed by
the migration table output. That is your confirmation the schema applied.

> **Free services have no Shell access.** The usual way to check this —
> `php artisan db:show`, which reports the driver and how many tables it sees —
> needs the Shell tab, and that is a paid feature. On free, the deploy logs are
> the only window you get.

### Seeding the admin user without a shell

`AdminUserSeeder` creates the account you sign in with, and on free you cannot
invoke it by hand. Add it to the entrypoint temporarily: in
`deploy/render/entrypoint.sh`, just below the migrate block, add

```sh
php artisan db:seed --force
```

then commit, push, and let the deploy run. Confirm in the logs, then **remove
those two lines and push again** so it does not re-run on every restart. The
seeder is idempotent — it updates the existing account rather than creating a
second one — so a stray extra run is harmless, but leaving it in means your admin
password resets to the environment variable on every single deploy.

Alternatively, connect to the database directly. Render gives every Postgres
instance an external connection string on its dashboard page, so you can run
`psql` or point a GUI at it from your own machine.

> **Never run `php artisan migrate:fresh` against this database.** It drops every
> table. There is no undo, and on the free plan there is no backup either.

## Step 5 — Wire the two services together

Now that both services exist, copy their real URLs from the dashboard. They look
like `https://50plusvoyagers-api.onrender.com`.

On **`50plusvoyagers-web`** → Environment:

| Variable | Value |
|---|---|
| `LARAVEL_ORIGIN` | the **api** service URL, no trailing slash |
| `NEXT_PUBLIC_SITE_URL` | the **web** service URL (its own public address) |

On **`50plusvoyagers-api`** → Environment:

| Variable | Value |
|---|---|
| `APP_URL` | the **web** service URL — the front end, not this service |

`APP_URL` pointing at the front end is deliberate. It is the origin every
generated URL has to be reachable on: an uploaded image, a mail link. Pointing it
at the PHP service hands browsers an address only the front end can reach.

### The rebuild that is easy to miss

**`LARAVEL_ORIGIN` is read at build time, not just at start time.** Next writes
the resolved rewrite targets into `.next/routes-manifest.json` during
`next build`, so `next start` uses whatever address was set when it *built* and
ignores a later change. Changing the variable is not enough — you must rebuild.

On the web service: **Manual Deploy** → **Clear build cache & deploy**.

The symptom of skipping this is distinctive and misleading: every page renders
fine, but images and `/api` calls return 500 with `ECONNREFUSED` against the
*old* address.

On a paid plan you can confirm the baked-in target from the web service's Shell:

```bash
grep -o 'https://[^"]*' .next/routes-manifest.json | sort -u
```

On free there is no Shell, so verify from outside instead — request something
that is proxied through to Laravel and see whether it arrives:

```bash
curl -I https://<web>.onrender.com/images/<any-file-in-public-images>
```

A `200` means the rewrite is pointing at the right place. A `500` means it is
not, and the rebuild above is the fix.

## Step 6 — Verify

Open the **web** service URL. You should get the real homepage.

```bash
curl -I https://<web>.onrender.com            # 200
curl https://<web>.onrender.com/api/…         # JSON, proxied to Laravel
curl -I https://<api>.onrender.com/up         # 200, the health check
```

Then sign in at `/admin` with the credentials from step 3 and upload an image.
It should appear immediately — and, on the free plan, disappear at the next
redeploy.

### If the homepage looks right but the content is stale

The homepage falls back to content baked into the front end when the API is
unreachable, so a visitor always gets a complete page rather than an empty one.
That is deliberate, and it means a broken API can look perfectly healthy from
outside. The giveaway is in the web service's logs:

```
[site] homepage content could not be fetched
```

Treat that line as an outage, not a warning. It almost always means
`LARAVEL_ORIGIN` is wrong or was changed without the rebuild from step 5.

---

## Deploy order is load-bearing

Render handles this for you on a push, but if you deploy by hand, the order from
`deploy/README.md` still applies:

```
1. migrate            schema must be new before anything reads it
2. npm ci
3. npm run build      prerenders public pages against the API as it is now
4. queue:restart
5. restart front end  it serves the build from step 3
```

Step 3 before step 5, always — restarting the front end before the build exists
serves the previous release's markup. Step 1 before step 3 for the mirror-image
reason: the homepage is prerendered from the database, so the schema has to be
current by the time the build reads it.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Pages render, images and `/api` 500 `ECONNREFUSED` | `LARAVEL_ORIGIN` changed without a rebuild — step 5 |
| `500` on every Laravel route | `APP_KEY` missing or malformed; check it kept the `base64:` prefix |
| Redirect loop, or admin login won't stick | proxy trust — verify the `bootstrap/app.php` change deployed |
| `could not find driver` | `pdo_pgsql` missing; the Dockerfile installs it, so the build likely failed earlier |
| First request takes ~1 min | free-tier spin-down; expected |
| Uploaded images vanished | free-tier ephemeral disk; expected — see below |
| `SQLSTATE … does not exist` | migrations did not run; check `RUN_MIGRATIONS=true` on the API |
| Build fails on `npm ci` | `package-lock.json` out of sync with `package.json` |
| `Cannot find module '@tailwindcss/postcss'` | build command is missing `--include=dev` — see step 3c |

Logs are per-service under the **Logs** tab; nginx and PHP errors both stream to
stdout/stderr by design, so everything lands there.

---

## Going to production

The free plan is for evaluating this. Four changes make it real, roughly in order
of how much they matter:

**1. Keep uploaded images.** Attach a persistent disk to the API service, mounted
at `/var/www/html/storage/app/public`. This needs a paid instance (disks start
around $0.25/GB/month) and requires **no code change** — `FileStore` and the
`public/storage` symlink keep working exactly as they do locally. Note the
trade-offs Render imposes: a service with a disk cannot scale past one instance,
and deploys briefly stop the old instance before starting the new one. The
alternative is S3 or Cloudflare R2 via `FILESYSTEM_DISK=s3`, which scales
properly but needs a bucket, credentials and a pass over URL generation.

**2. Run the queue.** Image derivatives, mail and sitemap work are queued, never
inline. On free there is no worker, so `QUEUE_CONNECTION` is set to `sync` and
those jobs run inline — correct, but it makes an upload as slow as the resizing
it triggers. On a paid plan, add a **Background Worker** from the same repo:
Docker runtime, `./Dockerfile`, docker command
`php artisan queue:work --tries=3 --max-time=3600`, the same `APP_KEY`,
`APP_URL`, `DB_CONNECTION` and `DB_URL` as the API — but **`RUN_MIGRATIONS`
unset**, so it never races the web service to migrate — then switch
`QUEUE_CONNECTION` back to `database` on both.

The scheduler is the same shape: a **Cron Job**, `* * * * *`, running
`php artisan schedule:run`. `routes/console.php` registers nothing beyond
`inspire` today, so it earns its keep only once you add a real scheduled task.

Both are also written out in `render.yaml`, which becomes usable once Blueprints
are unlocked.

**3. Keep the database.** A free Postgres instance stops being accessible 30 days
after creation, with a 14-day grace period before deletion, and free instances
get no backups at all. Upgrade before then. Either way, take your own backup from
your own machine using the external connection string on the database's dashboard
page:

```bash
pg_dump "<external-connection-string>" > backup.sql
```

**4. Make Laravel private.** Right now the API is a `web` service with a public
URL, because private services are a paid feature. That means Laravel is reachable
directly, bypassing Next. On a paid plan, change its `type` to `pserv` — it then
has no public URL and only the front end can reach it, which is the arrangement
`deploy/README.md` describes.

Also worth doing once you are paying: swap the migration-on-start hook for a real
`preDeployCommand`, and add a custom domain (**Settings → Custom Domain** on the
web service, then update `NEXT_PUBLIC_SITE_URL` and `APP_URL` — and rebuild).

---

## Cost

| | Free | Minimum realistic |
|---|---|---|
| Web (Next) | $0 | ~$7/mo |
| API (Laravel) | $0 | ~$7/mo |
| Queue worker | unavailable | ~$7/mo |
| Cron | unavailable | ~$1/mo |
| Postgres | $0, expires in 30 days | ~$6/mo |
| Disk for uploads | unavailable | ~$1/mo |

Prices move; check [render.com/pricing](https://render.com/pricing).
