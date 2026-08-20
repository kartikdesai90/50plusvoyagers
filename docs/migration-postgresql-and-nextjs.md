# Migration: MySQL → PostgreSQL, React/Inertia → Next.js

**Date:** 2026-08-18

Two technology changes, made together. Nothing about what the application does
changed: the same URLs, the same screens, the same admin API, the same data.

---

## 1. MySQL → PostgreSQL

### What moved

Every table, including seven groups of tables that no migration file describes
any more — they were created by work that was later reverted, and they still
hold rows. All 51 tables and 234 rows were transferred and then verified
field-by-field against the source.

### How to repeat it

`php artisan db:transfer-mysql`, with `LEGACY_DB_*` in `.env` pointing at the
MySQL database. Run `php artisan migrate` first: tables the migration files still
describe are built by Laravel, so their PostgreSQL shape is whatever the
framework itself would produce, and the command only fills them. Tables with no
migration file are rebuilt from MySQL's information schema.

`--pretend` lists what would move without writing. `--skip-ephemeral` leaves
sessions, cache and queue rows behind; by default they come too.

The command also:

- **Restores drifted columns.** `users` in MySQL carries `deleted_at` and `phone`,
  which no current migration creates. Dropping a populated column to tidy up a
  filing system would be losing data, so they are added back.
- **Resets every sequence** from the data. Copied rows carry their own ids and
  never touch the sequence, so without this the next insert into any table would
  be handed `1` and collide.
- **Adds foreign keys last**, after every table is full.
- **Is repeatable.** Every target table is emptied in a single
  `TRUNCATE … CASCADE` naming all of them, so the cascade has nothing outside
  the list to reach — truncating them one at a time works on a first run, when
  no foreign key exists yet, and destroys already-copied tables on the second,
  when they do. Foreign-key checking is then suspended for the connection
  (`session_replication_role`) while rows land in the source's alphabetical
  order rather than a dependency order. Without a superuser that step is skipped
  and reported, which is correct for a first run and honest about the rest.

### ⚠ `migrate:fresh` destroys the transferred data

`php artisan migrate:fresh` drops every table and rebuilds only what the current
migration files describe — which is 13 of the 51 this database holds. The other
38, and every row in them, are gone, and `--seed` then replaces the real content
with the seeders' sample content. It looks like a working application afterwards,
which is what makes it dangerous.

This has already happened once on this installation and was recovered by
re-running `php artisan db:transfer-mysql`, which is exactly why the command is
built to be repeatable. **Keep the MySQL database.** It is the only copy of those
38 tables, and while it exists any accident here costs one command.

Use `php artisan migrate` for pending migrations. If you genuinely need to start
over, `migrate:fresh` then `db:transfer-mysql` — in that order, never `--seed`.

### The one behavioural difference, and what was done about it

MySQL's `LIKE`, under the `utf8mb4_unicode_ci` collation this database used, is
case-insensitive. PostgreSQL's is not. Three admin search boxes — blog, feedback
and gallery — would silently have stopped matching "nagaland" against
"Nagaland".

Those queries now use Laravel's `whereLike`/`orWhereLike` with the default
case-insensitive flag, which renders as `ILIKE` on PostgreSQL and plain `LIKE`
everywhere else. Behaviour is identical to before on both.

Nothing else was database-specific: no raw SQL, no `DB::raw`, no MySQL functions,
no `ENUM` columns — statuses were already stored as strings precisely so an
enum would never need rebuilding.

### Configuration

`DB_CONNECTION=pgsql`, port 5432. `config/database.php` gained a `mysql_legacy`
connection, read only by the transfer command, so both ends can be held open at
once and the result can be checked against the original.

---

## 2. React (Inertia + React Router) → Next.js 16, App Router

### Why this was not a drop-in

The front end was not a standalone React app. The public site was **Inertia**:
Laravel controllers returned `inertia('home', [...])`, a Node SSR sidecar turned
that into finished markup, and `site.tsx` hydrated it. The admin panel was a
separate React Router SPA in a Blade shell.

Inertia has no Next.js adapter, and the App Router brings its own server and
router. So the migration necessarily moved the boundary: **Next serves every
page; Laravel is a JSON API.**

### What is where now

| | Before | After |
|---|---|---|
| Public pages | Laravel + Inertia + SSR sidecar | Next App Router, `frontend/src/app/(site)/` |
| Admin screens | Blade shell + React Router SPA | Next App Router, `frontend/src/app/admin/` |
| Homepage content | Inertia page props | `GET /api/site/home`, fetched during the server render |
| Admin CRUD | `/api/admin/*` | **`/api/admin/*`, byte-for-byte unchanged** |
| Page `<head>` | `<Seo>` → Inertia `<Head>` | Next `metadata` / `generateMetadata` |
| 404 for unknown slug | `whereIn` constraint on the Laravel route | `generateStaticParams` + `dynamicParams = false` |

### Decisions worth knowing about

**The router shim.** `frontend/src/shared/router` re-implements the four pieces
of React Router the panel used — `Link`, `NavLink`, `Navigate`, `useNavigate`,
`useLocation`, `useParams` — on top of `next/navigation`, with the same names and
signatures. Twenty-eight admin screens changed one import line and nothing else.
Rewriting them would have meant twenty-eight chances to change behaviour while
claiming not to.

React Router's navigation `state` has no Next equivalent, and the panel uses it
for two things: the "saved" notice an index screen shows after a form redirects
to it, and the address login should return to. The shim leaves that parcel in
`sessionStorage` keyed by the address it is addressed to, collected once on
arrival.

**Everything goes through Next.** `next.config.ts` forwards `/api`, `/storage`,
`/images`, `/favicon.ico` and `/robots.txt` to Laravel. For the assets that is
tidiness; for `/api` it is correctness. The panel authenticates with a Laravel
session cookie and a matching `XSRF-TOKEN`, both same-origin. A browser calling
Laravel on its own port would make them cross-site: `SameSite=None; Secure`, a
stateful-domain list, and a signed-in editor one browser privacy default away
from being signed out.

**Slugs have one source again.** `GroupTourController::SLUGS` and
`JournalController::SLUGS` existed to 404 unknown addresses, and each carried a
comment saying it must be kept in step with a front-end data module by hand. The
route now derives its slugs from that module directly, so the two cannot drift —
and every declared slug is prerendered at build time, which means a slug with no
page behind it fails the build rather than 404ing in production.

**Plain `<img>` stays.** `next/image` would wrap every picture in a sized
container, rewrite the `src` through an optimiser and change loading behaviour.
The design places images with `object-fit` inside hand-tuned aspect boxes and the
motion layer animates several of them, so swapping the element is a visual
change. The lint rule is off, with that reasoning recorded next to it.

**Area isolation survived.** `site/` and `admin/` still import from neither each
other nor upward, enforced by ESLint. That rule was what kept GSAP, Lenis and
SplitType out of the editor's bundle and Radix out of a visitor's — the job the
two Vite entries used to do, now done by route boundaries plus the rule.

### What was retired

Moved to `_retired-inertia/`, not deleted — this repository is not under version
control, so nothing here can be recovered by other means:

- `resources/` (js, css, views) — the source now lives in `frontend/src/`
- `ShareInertiaProps` middleware, `AlertOnSsrFailure` listener, `config/inertia.php`
- `GroupTourController`, `JournalController`, `StaticPageController`, `NotFoundController`
- root `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `package.json`, `components.json`
- the four test files that asserted Inertia and Blade specifics (see below)

`inertiajs/inertia-laravel` was removed from `composer.json`.

### Tests

99 passing, on both SQLite and PostgreSQL.

- **Unchanged and passing:** every admin CRUD suite. The `/api/admin/*` contracts
  did not move, which is the strongest evidence that they did not change.
- **Rewritten, same assertions:** `HomepageBandsTest` and `HomepageFeedbackTest`
  read `GET /api/site/home` instead of Inertia props. Same queries, same
  resources, same expectations — different transport.
- **Replaced:** `RouteOrderTest` → `ApiSurfaceTest`. The old suite guarded
  against an SPA catch-all swallowing the API; that catch-all is gone with the
  shell it served. The new one pins down the boundary that replaced it — Laravel
  answers on `/api` and `/up`, and 404s every page address, so two applications
  can never quietly claim the same URL.
- **Retired:** `PublicPagesTest`, `ServerRenderingTest`, `SharedPropsTest`,
  `HomePageTest`. All four asserted Inertia components, the Blade root view, the
  SSR sidecar's configuration or Inertia's shared props. None of those exist.

  The coverage they provided is not simply gone: "every declared slug resolves"
  is now enforced by `next build`, which prerenders all 15 articles and 20 tours
  and fails if one has no page. The boot cloak and per-page `<head>` were checked
  by hand against the running site.

### Still to know

The deeper generated documents in this folder — `architecture.md`,
`component-inventory.md`, `source-tree-analysis.md`, `development-guide.md`,
`motion-layer.md`, `project-overview.md` — still describe the Inertia/Vite
arrangement and paths under `resources/js`. The component and motion material is
still accurate about the components themselves, which moved unchanged; the paths
and the transport are not. Regenerating them is the `document-project` workflow's
job, not this migration's.
