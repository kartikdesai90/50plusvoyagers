# 50 Plus Voyagers

A Next.js 16 front end (App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui) in front of a
Laravel 13 JSON API on PostgreSQL.

Next serves every address a person types — the public site and the `/admin` panel alike — and
reaches Laravel for data. Laravel serves no HTML.

## Requirements

| Tool       | Version                                    |
| ---------- | ------------------------------------------ |
| PHP        | 8.3+                                       |
| Composer   | 2.x                                        |
| PostgreSQL | 14+ (developed against 18)                 |
| Node.js    | 20.9+ or 22.x (Next 16 requirement)        |

The PHP build needs `pdo_pgsql`. `php -m | grep pgsql` will tell you whether you have it; on a stock
Windows PHP it is present but commented out in `php.ini`.

## Getting started

```bash
composer install
npm --prefix frontend install
cp .env.example .env
php artisan key:generate
createdb 50_plusvoyagers        # or however your host makes databases
php artisan migrate
php artisan db:seed
```

Run the two halves in two terminals:

```bash
php artisan serve                 # http://localhost:8000  — the API
npm --prefix frontend run dev     # http://localhost:3000  — the site, and what you open
```

Or start everything at once (API, queue, logs, front end):

```bash
composer run dev
```

Open `http://localhost:3000`. Do not open port 8000 in a browser — it answers `/api` and nothing
else, so every page there is a 404 by design.

## Moving an existing MySQL database across

If you have a database from before the PostgreSQL migration, point `LEGACY_DB_*` in `.env` at it,
create and migrate the PostgreSQL one, then:

```bash
php artisan db:transfer-mysql --pretend    # what would move, and how much of it
php artisan db:transfer-mysql
```

It copies every table, including any that no migration file describes any more, restores columns
that drifted out of the migrations, recreates indexes and foreign keys, and resets every sequence
from the data — so the first insert after the move does not collide with a copied row.

## Scripts

Front end (`npm --prefix frontend run …`, or from inside `frontend/`):

| Command             | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `dev`               | Next dev server on :3000                       |
| `build`             | Production build; prerenders every public page |
| `start`             | Serve the production build                     |
| `types`             | Type-check only                                |
| `lint` / `lint:fix` | ESLint (flat config, type-aware)               |
| `format`            | Prettier, with Tailwind class sorting          |

Back end:

| Command                      | Purpose                 |
| ---------------------------- | ----------------------- |
| `php vendor/bin/pint`        | Format PHP              |
| `php vendor/bin/pint --test` | Check PHP formatting    |
| `php artisan test`           | PHPUnit test suite      |

## Structure

```
app/                              Laravel application code
routes/
├── web.php                       requires the two API files; serves no HTML
├── admin.php                     /api/admin/* — the panel, session-authenticated
└── site.php                      /api/site/*  — what the homepage needs, public

frontend/
├── next.config.ts                proxies /api, /storage and /images to Laravel
└── src/
    ├── app/                      the route tree
    │   ├── layout.tsx            the document both areas render into
    │   ├── (site)/               public routes — group, so it is not in the URL
    │   └── admin/                the panel; (panel) inside it is the signed-in tier
    ├── site/                     the public area: pages, features, motion layer, data
    ├── admin/                    the panel: pages, features, auth
    ├── shared/                   what both may use — HTTP client, UI primitives, router
    └── styles/app.css            Tailwind v4 entry + design tokens
```

### Area isolation

`site/` and `admin/` never import from each other, and `shared/` imports from neither. This is
enforced by ESLint, and it is what keeps GSAP, Lenis and SplitType out of the bundle an editor
downloads and Radix out of a public visitor's.

### Path alias

`@/*` maps to `frontend/src/*`.

### Routing

Public URLs are files under `frontend/src/app/(site)/`. The tour and article routes derive their
valid slugs from the content modules they render, so an unknown one is a real 404 and every declared
one is prerendered at build time — a slug with no page behind it fails the build.

Admin URLs are files under `frontend/src/app/admin/`. The panel screens were written against React
Router; `@/shared/router` re-implements the four pieces of it they use on top of `next/navigation`,
so the screens themselves are unchanged.

### Adding shadcn/ui components

Components live in `frontend/src/shared/ui`.
