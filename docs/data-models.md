> ## ℹ️ ACCURATE AGAIN AS OF 2026-08-17
> This was generated on 2026-08-10, when `User` was the only model, and was marked stale while the
> 38-table business schema existed. That schema was reverted on 2026-08-17, so this file describes
> the codebase again. The 38-table design is still on paper in
> `_bmad-output/planning-artifacts/data-model.md` (no longer in this repo)
> as a proposal, and its implementation is in `_reverted/`.

# Data Models — 50plusvoyagers

**Generated:** 2026-08-10

There are two distinct "data" stories in this project, and today they do not meet.

## 1. Database (Laravel) — framework skeleton only

**Connection:** SQLite by default (`DB_CONNECTION=sqlite`, `database/database.sqlite`).
MySQL settings are present but commented out in `.env.example`.

### Migrations

| Migration                                      | Effect                                         |
| ---------------------------------------------- | ---------------------------------------------- |
| `0001_01_01_000000_create_users_table.php`     | `users`, `password_reset_tokens`, `sessions`   |
| `0001_01_01_000001_create_cache_table.php`     | `cache`, `cache_locks`                         |
| `0001_01_01_000002_create_jobs_table.php`      | `jobs`, `job_batches`, `failed_jobs`           |
| `2026_08_10_000000_add_is_admin_to_users_table.php` | Adds `users.is_admin` (boolean, default false) |

The first three are stock Laravel. Only the last is application-specific.

Sessions, cache, and queue are all database-backed (`SESSION_DRIVER=database`,
`CACHE_STORE=database`, `QUEUE_CONNECTION=database`), so those tables are live infrastructure even
though no domain data exists.

### Eloquent Models

| Model             | Notes                                                                            |
| ----------------- | -------------------------------------------------------------------------------- |
| `App\Models\User` | Stock Laravel model plus `is_admin` (cast to boolean) and an `isAdmin()` helper. |

`is_admin` is deliberately **absent from `$fillable`** so admin rights can never be granted by mass
assignment — `AdminUserSeeder` sets the attribute explicitly. See
[admin-panel.md](./admin-panel.md#security-properties-all-verified).

`Database\Seeders\AdminUserSeeder` creates (or promotes, idempotently) the default administrator.
`Database\Factories\UserFactory` is stock.

### Implication

Apart from admin accounts there is **no persisted domain data** — no trips, departures, testimonials,
or articles in the database. Everything the homepage shows is hard-coded on the front end (below).

## 2. Front-End Content Model — `frontend/src/site/data/home.ts`

This module is the de-facto content schema. Every export is typed, and the types are the contract a
future API should satisfy.

```ts
const img = (name: string) => `/images/home/${name}.jpg`;
```

| Type          | Export             | Shape                                                        |
| ------------- | ------------------ | ------------------------------------------------------------ |
| `HeroSlide`   | `heroSlides`       | `{ src, alt }` — 5 carousel frames                          |
| `Value`       | `values`           | `{ title, body, src }` — 4 "who we are" cards               |
| `PressLogo`   | `pressLogos`       | `{ name, className }` — styled wordmarks, not image files   |
| `Trip`        | `trips`            | `{ tag, title, price, when, nights, src }`                  |
| `Toast`       | `toasts`           | `{ name, trip, body, src }` — testimonials                  |
| `Film`        | `films`            | `{ name, role, src, featured? }` — `featured` = taller card |
| `GalleryItem` | `gallery`          | `{ place, year, note, src }`                                |
| `HostingStep` | `hostingSteps`     | `{ title, body }` — numbered 01–04                          |
| `Article`     | `articles`         | `{ title, date, read, src }` — journal cards                |
| —             | `departureMonths`  | `string[]` — month tab labels                               |
| —             | `whyPoints`        | `string[]` — checklist bullets                              |
| —             | `dividers`         | `{ adventure, sorted }` → `{ src, alt, title, body, cta }`  |
| —             | `whyImage`         | `{ src, alt }`                                              |

### Notable characteristics

- **Prices are pre-formatted strings** (`'₹56,500'`), not numbers. Dates are display strings
  (`'9 Aug 2026'`), not ISO. Both would need normalising if this became API-driven.
- **Images are referenced by semantic name**, resolved through `img()`. Some assets are shared —
  `pangong-lake`, `paro-valley`, `kerala-backwaters`, and `cappadocia` appear in both the hero
  carousel and the gallery; `face-ranjini` and `face-suresh` appear in both toasts and films.
- **Content is fully decoupled from markup.** Section components import these arrays and render
  them; no copy is inlined in JSX.

### Site configuration — `frontend/src/site/config/site.ts`

Separate from page content: brand name, phone/email (and their `tel:`/`mailto:` hrefs), the split
`navLeft`/`navRight` header nav, and the four-column `footerNav`.

## 3. Migration Path to a Real Backend

When trips/articles/testimonials become dynamic:

1. **Keep the TypeScript types** in `site/data/home.ts` — make them the shared contract.
2. Create migrations and Eloquent models mirroring them (`trips`, `departures`, `testimonials`,
   `articles`, `gallery_items`).
3. Create `routes/api.php` **and register it** in `bootstrap/app.php` — `withRouting()` currently
   declares only `web`, `commands`, and `health`.
4. Fetch via the pre-configured client in `frontend/src/shared/lib/axios.ts` (base URL
   `VITE_API_BASE_URL`, default `/api`, sends `withCredentials` + `withXSRFToken` so Sanctum
   cookie auth works without extra setup).
5. Normalise prices to integers-plus-currency and dates to ISO, formatting at render time.
6. Section components should need **no changes** if the shapes are preserved.

## 4. Environment Variables

| Variable             | Default             | Used by                                  |
| -------------------- | ------------------- | ---------------------------------------- |
| `APP_NAME`           | `50 Plus Voyagers`  | Laravel; also feeds `VITE_APP_NAME`      |
| `VITE_APP_NAME`      | `${APP_NAME}`       | `siteConfig.name`                        |
| `VITE_API_BASE_URL`  | `/api`              | `lib/axios.ts` base URL                  |
| `DB_CONNECTION`      | `sqlite`            | Database                                 |
| `SESSION_DRIVER`     | `database`          | Sessions                                 |
| `CACHE_STORE`        | `database`          | Cache                                    |
| `QUEUE_CONNECTION`   | `database`          | Queue                                    |

Only `VITE_`-prefixed variables reach the browser bundle.
