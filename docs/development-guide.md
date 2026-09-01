# Development Guide — 50plusvoyagers

**Generated:** 2026-08-10

## Prerequisites

| Tool     | Required                    | Why                                                      |
| -------- | --------------------------- | -------------------------------------------------------- |
| PHP      | **8.3+**                    | `composer.json` requires `^8.3` and pins platform 8.3.33 |
| Composer | 2.x                         |                                                          |
| Node.js  | **20.19+ or 22.12+**        | Vite 7 requirement                                       |

> The root `README.md` still says "PHP 8.2+ / Laravel 12". That is **stale** — `composer.json`
> requires `laravel/framework ^13.24` and `php ^8.3`.

## Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Or: `composer run setup` (does all of the above plus `npm run build`).

## Running

```bash
composer run dev     # server + queue + logs + vite, concurrently
```

Individually:

```bash
php artisan serve    # http://localhost:8000
npm run dev          # http://127.0.0.1:5173 (HMR + Fast Refresh)
```

This project also works under **Laravel Herd** at `http://50plusvoyagers.test`.

## Scripts

| Command                      | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `npm run dev`                | Vite dev server, HMR, React Fast Refresh         |
| `npm run build`              | `tsc -b` typecheck **then** production build     |
| `npm run types`              | Typecheck only                                   |
| `npm run lint`               | ESLint, type-aware, `--max-warnings=0`           |
| `npm run lint:fix`           | ESLint with autofix                              |
| `npm run format`             | Prettier (with Tailwind class sorting)           |
| `npm run format:check`       | Prettier in check mode                           |
| `php artisan test`           | PHPUnit                                          |
| `php vendor/bin/pint`        | Format PHP                                       |
| `php vendor/bin/pint --test` | Check PHP formatting                             |

**Before committing:** `npm run format && npm run types && npm run lint && npm run build`

## Known Environment Gotchas

These were hit during development on this machine — check them first when something behaves oddly.

### PHP on `PATH` may be the wrong version

`which php` can resolve to XAMPP's PHP 8.2 (`/d/xampp8.2/php/php`) while the project requires 8.3+.
Symptom:

```
Composer detected issues in your platform: Your Composer dependencies require
a PHP version ">= 8.3.0". You are running 8.2.12.
```

Any `php artisan …` command fails at autoload.

**Fix — use Herd's PHP 8.3 explicitly:**

```bash
"$HOME/.config/herd/bin/php83/php.exe" artisan migrate
```

(Herd also ships `php84`.) Or put the 8.3 binary ahead of XAMPP on `PATH`.

### XAMPP can take port 80 from Herd

When XAMPP's Apache is running, `http://50plusvoyagers.test` resolves to XAMPP's dashboard (a 302 to
the XAMPP welcome page) instead of this app. Symptom: the site "becomes" someone else's page with no
code change. Fix: stop XAMPP's Apache, or serve on another port.

### Node version warning

Vite 7 wants Node 20.19+ / 22.12+. Node 22.11 builds but prints:

```
You are using Node.js 22.11.0. Vite requires Node.js version 20.19+ or 22.12+.
```

Builds have succeeded regardless, but upgrade when convenient.

### Headless Chrome clamps narrow window widths

If you screenshot for responsive checks, `--window-size=390,…` does **not** produce a 390 px layout —
Chrome clamps to roughly >420 px and crops, which looks like a horizontal-overflow bug that isn't
real. Use CDP `Emulation.setDeviceMetricsOverride` for genuine mobile widths.

## Conventions

### TypeScript / React

- **Strict everything** — `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.
- **Inline type imports** are enforced: `import { type Foo } from '…'`.
- **Path alias `@/`** → `frontend/src/`. Never use deep relative imports. Declared in both
  `vite.config.ts` and `tsconfig.app.json` — change both together.
- **`react-hooks` rules are errors.** Notably `set-state-in-effect`: calling `setState` synchronously
  in an effect body will fail lint. Prefer deriving state or handling it in the event handler.
- Section components stay **pure renderers** — content belongs in `site/data/home.ts`.

### Styling

- Tailwind v4, **CSS-first**. There is no `tailwind.config.js`; tokens live in `@theme` in
  `frontend/src/styles/app.css`.
- Merge classes with `cn()` from `@/shared/lib/utils`.
- Prefer brand token utilities (`bg-brand`, `text-ink-muted`, `border-hairline`) for design work.
- Preserve the `clamp()` fluid values — don't convert them into breakpoint steps.
- Add complex nested hover/focus behaviour as a `.voy-*` class in `@layer components`, not as a
  tangle of arbitrary variants.

### PHP

- Laravel Pint for formatting (`pint.json`).
- Routing config lives in `bootstrap/app.php` (Laravel 11+ style — no `Kernel.php`).

## Testing

- The PHPUnit suite is a single `Feature` group under `tests/Feature/` — the
  admin CRUD surface, the public API and the homepage bands. `tests/Unit/` does
  not exist; nothing here has needed an isolated unit yet.
- **No front-end test setup exists.** If you add one, Vitest + Testing Library fits the stack.

The de-facto front-end safety net today is `npm run types` + `npm run lint` + a successful build.

## Adding shadcn/ui Components

There is no `components.json` and the shadcn CLI is not wired up: the primitives
in `frontend/src/shared/ui/` were vendored in by hand and are edited in place.
Add a new one by copying the upstream source into that directory and adjusting
it to the tokens in `frontend/src/styles/app.css`.

Note that `Button` has **custom brand variants** (`brand`, `outline_circle`,
`pill`, `circle`); if you ever re-add or upgrade it, re-apply those.

## Common Tasks

| Task                          | Where                                                                  |
| ----------------------------- | ---------------------------------------------------------------------- |
| Change homepage copy          | `frontend/src/site/data/home.ts`                                             |
| Swap a homepage image         | Drop the JPEG in `public/images/home/`, reference via `img('name')`     |
| Change nav / contact details  | `frontend/src/site/config/site.ts`                                           |
| Adjust brand colours          | `:root` in `frontend/src/styles/app.css`                                      |
| Adjust section rhythm         | `Section` `top`/`bottom` props, or the `--spacing-*` tokens             |
| Add a client route            | `frontend/src/routes/paths.ts`, then a directory under `frontend/src/app/` |
| Add a section                 | See [component-inventory.md](./component-inventory.md#adding-a-new-homepage-section) |
| Touch animation               | See [motion-layer.md](./motion-layer.md)                                |

## Admin Panel

Seed an administrator, then sign in at `/admin/login`:

```bash
"$HOME/.config/herd/bin/php83/php.exe" artisan migrate
"$HOME/.config/herd/bin/php83/php.exe" artisan db:seed
```

Defaults are `admin@50voyagers.com` / `password`, overridable via `ADMIN_EMAIL` / `ADMIN_PASSWORD`
in `.env`. See [admin-panel.md](./admin-panel.md) for the architecture and how to add a module.

## Outstanding Work

1. **Refresh `README.md`** — Laravel/PHP versions, and it references a non-existent `routes/api.php`.
3. **Wire the newsletter form** in `site/features/home/contact.tsx` — it currently only prevents default
   submission (as did the reference); the code comment marks the spot.
4. **Placeholder links** — several nav/footer/CTA links point at `paths.home` or `#` pending real
   destinations.
5. **Auth** — "Log In / Register" in the header is a placeholder.
6. **Tests** — no meaningful coverage on either side.
