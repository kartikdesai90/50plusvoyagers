# Project Overview — 50plusvoyagers

**Generated:** 2026-08-10
**Repository type:** Monolith
**Project type:** `web`

## Executive Summary

50+ Voyagers is a travel brand running small-group, fully-hosted trips for travellers over fifty.
This repository holds their marketing site: a Laravel 13 application whose only job today is to serve
a Blade shell, and a React 19 single-page app that renders a long-form marketing homepage.

The homepage was rebuilt from a supplied standalone HTML reference design. Fidelity to that reference
— layout, fluid typography, colour, spacing, and motion — is a primary constraint on future changes.

## What Exists Today

| Area              | State                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| Marketing homepage | Complete — 13 sections, fully responsive, animated                       |
| 404 page          | Complete — minimal                                                        |
| Design system     | Established — brand tokens in `app.css`, shadcn/ui primitives             |
| Motion system     | Implemented — GSAP + ScrollTrigger + Lenis (**see caveat below**)         |
| Admin panel       | Auth + dashboard shell — see [admin-panel.md](./admin-panel.md)           |
| API layer         | Admin auth only, in `routes/web.php` (needs session + CSRF)               |
| Domain model      | **None yet** — `User` + `is_admin`; catalogue lands in Epic 3            |
| Customer auth     | **None** — header "Log In / Register" is still a placeholder              |
| Tests             | Laravel skeleton examples only; no front-end tests                        |
| CI/CD             | None in repo                                                              |

## Architecture at a Glance

```
Browser
  │
  ├─ GET /  (any non-asset path)
  │     └─ routes/web.php  →  Route::view('/{any?}', 'app')
  │           └─ resources/views/app.blade.php   (Blade shell: #app + Vite tags + font links)
  │
  └─ Vite bundle
        └─ frontend/src/app.tsx
              └─ AppRouter (react-router BrowserRouter)
                    └─ SiteLayout           ← starts the motion layer
                          ├─ SiteHeader
                          ├─ <Outlet/>  →  HomePage  (composes 13 section components)
                          └─ SiteFooter
```

**Structure:** the front end is split into `site/` (public), `admin/` (staff) and `shared/`, with
one-directional dependencies — see [source-tree-analysis.md](./source-tree-analysis.md) and
`_bmad-output/planning-artifacts/architecture.md`.

**Key characteristic:** the server contributes no data to the public site yet. Every string and image path on the homepage
originates in `frontend/src/site/data/home.ts`. Swapping to a CMS or API later means changing that one
module's source, not the components.

## Technology Stack

| Category         | Technology          | Version   | Notes                                                        |
| ---------------- | ------------------- | --------- | ------------------------------------------------------------ |
| Back-end runtime | PHP                 | ^8.3      | `composer.json` pins platform to 8.3.33                      |
| Framework        | Laravel             | ^13.24    | README still says 12 — stale                                 |
| REPL             | laravel/tinker      | ^3.0      |                                                              |
| Database         | SQLite              | —         | `database/database.sqlite`, framework tables only            |
| Front-end        | React               | ^19.2.8   |                                                              |
| Routing          | react-router        | ^8.3.0    | `BrowserRouter`, client-side only                            |
| Language         | TypeScript          | ^6.0.3    | `strict`, `noUnusedLocals`, `verbatimModuleSyntax`           |
| Build            | Vite                | ^7.0.7    | via `laravel-vite-plugin` ^2.0                               |
| Styling          | Tailwind CSS        | ^4.0.0    | CSS-first config via `@theme` — no `tailwind.config.js`      |
| UI primitives    | shadcn/ui           | —         | `new-york` style, `neutral` base, CSS variables              |
| Icons            | lucide-react        | ^1.28.0   | **v1 removed brand icons** — see `shared/ui/brand-icons.tsx` |
| Animation        | gsap                | ^3.15.0   | core + ScrollTrigger                                         |
| Smooth scroll    | lenis               | ^1.3.26   | MIT                                                          |
| Text splitting   | split-type          | ^0.3.4    | ISC — hero heading line stagger                              |
| HTTP             | axios               | ^1.19.0   | Configured but unused                                        |
| Lint             | ESLint (flat)       | ^9.39.5   | type-aware, `--max-warnings=0`                               |
| Format           | Prettier            | ^3.9.6    | with Tailwind class sorting, 4-space, 100 cols               |
| PHP format       | Laravel Pint        | ^1.27     |                                                              |
| PHP tests        | PHPUnit             | ^12.5.12  |                                                              |

## Architectural Decisions Worth Knowing

1. **Design tokens are mapped onto shadcn's token names.** In `frontend/src/styles/app.css`, the brand
   palette drives `--primary`, `--background`, `--border`, etc. So `Button` and `Card` inherit the
   brand automatically without per-component overrides.

2. **Fluid sizing is preserved verbatim from the reference.** Values like
   `clamp(56px, 8vw, 116px)` are registered as Tailwind theme tokens (`--spacing-section`,
   `--text-display`) rather than snapped to a fixed scale. This is deliberate: it keeps the rebuilt
   page pixel-faithful across all viewport widths.

3. **Complex CSS lives in `@layer components`, not in arbitrary Tailwind variants.** The hero reveal
   choreography, divider scrims, and film cards use hand-written `.voy-*` classes because the nested
   hover/focus logic is far clearer as CSS than as utility soup.

4. **Content is separated from presentation.** `site/data/home.ts` exports typed arrays; section
   components are pure renderers. This was done so the content can later come from an API.

5. **The motion layer is a standalone, framework-agnostic module.** `site/motion/motion.ts` exports a single
   `startMotion()` that returns a teardown function; React only wraps it in a hook.

## Current Caveats

- **README is partially stale** (Laravel version, PHP version, a reference to `routes/api.php`).
- **Local PHP mismatch is common on this machine:** the PHP on `PATH` may be XAMPP's 8.2, while the
  project requires 8.3+. See [development-guide.md](./development-guide.md#known-environment-gotchas).

## Where To Go Next

| Goal                          | Start here                                                 |
| ----------------------------- | ---------------------------------------------------------- |
| Change homepage copy/images   | `frontend/src/site/data/home.ts`                                 |
| Add a homepage section        | [component-inventory.md](./component-inventory.md) → "Adding a section" |
| Adjust colours/spacing/type   | `frontend/src/styles/app.css` (`:root` + `@theme`)                |
| Touch animations              | [motion-layer.md](./motion-layer.md)                        |
| Build the API                 | [architecture.md](./architecture.md) → "Back-end structure" |
