# Source Tree Analysis — 50plusvoyagers

**Generated:** 2026-08-10 · **Updated:** after Epic 2 (two-area restructure)
**Authority:** `_bmad-output/planning-artifacts/architecture.md`

## The organising rule

Front-end code lives in exactly one of three top-level folders, and dependencies flow one way:

```
site/  ─┐
        ├──►  shared/          site/ ↛ admin/     admin/ ↛ site/
admin/ ─┘                      shared/ ↛ either
```

Anything both areas need is promoted to `shared/`. Anything only one area needs stays in that area
**even if it looks generic** — that is what stopped marketing-only code (motion, hero slider, site
config, brand icons) from masquerading as shared utilities.

## Front end

```
resources/js/
├── app.tsx                          mounts #app
│
├── routes/
│   ├── index.tsx                    composes the two area trees; imports neither area
│   ├── paths.ts                     URL constants, nested per area
│   ├── site-routes.tsx              site lazy boundaries + route tree
│   └── admin-routes.tsx             admin lazy boundaries + route tree
│
├── site/                            public website
│   ├── layout/
│   │   ├── site-layout.tsx          header + <main> + footer; starts the motion layer
│   │   ├── site-header.tsx
│   │   └── site-footer.tsx
│   ├── pages/                       home.tsx · not-found.tsx        (mirrors routes)
│   ├── features/
│   │   └── home/                    12 section components + use-hero-slider
│   ├── components/
│   │   ├── section.tsx              Section/Container/Eyebrow/SectionHeading/RuleLink
│   │   └── brand-icons.tsx
│   ├── motion/                      motion.ts · use-site-motion.ts
│   ├── data/home.ts                 content (becomes the DB seeder in Epic 3)
│   └── config/site.ts
│
├── admin/                           staff panel
│   ├── layout/
│   │   ├── admin-layout.tsx         authenticated shell — sidebar + header + main
│   │   ├── admin-auth-layout.tsx    unauthenticated shell — centred card
│   │   ├── admin-brand.tsx  admin-nav.tsx  admin-user-menu.tsx
│   ├── auth/                        admin-boot · protected-route · auth-provider
│   │                                auth-context · auth-api · types
│   ├── pages/                       login.tsx · dashboard.tsx
│   ├── components/                  page-header · stat-card · admin-splash
│   └── config/nav.ts                sidebar source of truth
│
└── shared/
    ├── ui/                          shadcn primitives + route-fallback
    └── lib/                         utils · axios · api-error · boot-cloak
```

### Four tiers in the admin route tree

Kept as separate concerns rather than all being called "layout":

| Tier | Component | Responsibility |
|---|---|---|
| boundary | `AdminBoot` | mounts the auth provider, releases the boot cloak |
| layout | `AdminAuthLayout` / `AdminLayout` | page chrome and the `.admin-theme` class |
| guard | `ProtectedRoute` | redirects when unauthenticated, splash while resolving |
| page | `login` / `dashboard` | content only — never sets theme or chrome |

`AdminBoot` must stay outermost. Hoist a layout above it and the login screen loses the auth
provider and the cloak is never released.

## Back end

```
app/Http/
├── Controllers/Admin/AuthController.php
├── Middleware/EnsureUserIsAdmin.php
├── Requests/Admin/LoginRequest.php
└── Resources/Admin/AdminUserResource.php
app/Models/User.php                  + is_admin

routes/
├── web.php                          admin API, then the SPA catch-all LAST
└── console.php

database/
├── migrations/                      3 stock + add_is_admin_to_users
└── seeders/                         DatabaseSeeder + AdminUserSeeder
```

Per the architecture, this grows into `Controllers/{Admin,Site}/`, `Actions/`, `Services/`,
`Policies/`, `Enums/`, and split route files. The public namespace is **`Site`**, not `Public` —
`public` is a PHP reserved keyword and is illegal as a namespace segment.

## Bundles

The split is enforced by the lazy boundaries in `routes/*-routes.tsx`:

| Chunk | gzip | Loaded by |
|---|---|---|
| `app` | 93.8 kB | everyone (React + router core) |
| `site-layout` | 58.0 kB | site only (GSAP · Lenis · SplitType) |
| `admin-layout` | 31.7 kB | admin only (Radix) |
| `home` / `login` / `dashboard` | 7.6 / 2.6 / 2.6 kB | per page |

`routes/index.tsx` must not import from either area — that is why the Suspense fallback lives in
`shared/ui/route-fallback.tsx` rather than reusing the admin splash.

## Tooling that hardcodes paths

Update these together with any move:

| File | Setting |
|---|---|
| `eslint.config.js` | `resources/js/shared/ui/**` and `resources/js/routes/**` react-refresh overrides |
| `components.json` | `ui` → `@/shared/ui`, `lib` → `@/shared/lib`, `utils` → `@/shared/lib/utils` |
| `vite.config.ts` + `tsconfig.app.json` | the `@` alias (both, together) |

Tailwind's `@source '../js'` covers any nesting and needs no change.

## Structural couplings

Pure file moves don't affect these, but don't "tidy" them:

1. `motion.ts` selects `main section` — `site-layout` must keep `<main>` wrapping the outlet.
2. `.admin-theme` must sit on the outermost element of every admin shell.
3. `auth-context.ts` must stay component-free (react-refresh rule).
4. `boot-cloak.ts` must stay dependency-free — admin imports it and must not pull GSAP.
5. Laravel route order: API above the SPA catch-all, whose regex excludes `api`.

## Notable absences

- `routes/api.php` — the admin API lives in `web.php` because it needs session + CSRF.
- `tailwind.config.js` — Tailwind v4 is configured in `app.css` via `@theme`.
- Front-end tests — none yet.
