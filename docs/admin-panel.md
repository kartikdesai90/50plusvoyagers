# Admin Panel — 50plusvoyagers

**Generated:** 2026-08-10 · **Confirmed accurate again:** 2026-08-17
**Scope:** Foundation only — authentication, protected routing, layout shell, placeholder dashboard.
No business modules or CRUD exist, by design.

> The modules built between 2026-08-14 and 2026-08-17 — pictures, staff accounts, admin password
> recovery, settings and navigation, and Tours — were reverted on 2026-08-17 at the client's
> request. Their code is in `_reverted/` and a whole-project copy from just before the revert is in
> `_snapshot-2026-08-17/`. See `_bmad-output/implementation-artifacts/sprint-status.yaml`.

## Default Credentials

Seeded by `AdminUserSeeder` (`php artisan db:seed`):

| Field    | Value                                     |
| -------- | ----------------------------------------- |
| Email    | `admin@50voyagers.com`                    |
| Password | `password`                                |

Overridable via `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` in `.env`. **Change the password
before any non-local environment.** The seeder is idempotent — re-running updates the existing
account rather than creating a duplicate.

## Authentication Design

**Session cookies, not tokens.** The SPA is served from the same Laravel app, so there is no
cross-origin problem and nothing to store client-side. This also avoided adding Sanctum, keeping the
Composer dependency set untouched.

### Why the endpoints live in `routes/web.php`

They need session state and CSRF protection, which come from the `web` middleware group.
`routes/api.php` is stateless, so putting them there would have required extra wiring.

**Two ordering constraints that will bite if disturbed:**

1. The admin routes are declared **above** the SPA catch-all in `routes/web.php`. Move them below and
   they stop resolving.
2. The catch-all's regex excludes `api`: `^(?!api|build|storage).*$`.

### Endpoints

| Method | Path                     | Middleware      | Purpose                                   |
| ------ | ------------------------ | --------------- | ----------------------------------------- |
| GET    | `/api/admin/csrf-cookie` | `web`           | Primes `XSRF-TOKEN` before a POST         |
| POST   | `/api/admin/login`       | `web`           | Authenticate; 422 on failure              |
| GET    | `/api/admin/me`          | `auth`, `admin` | Current admin; 401 when no session        |
| POST   | `/api/admin/logout`      | `auth`, `admin` | Destroy session                           |

### Security properties (all verified)

- There is no role column and nothing to grant by mass assignment: every row in `users` is an admin,
  and `User::isAdmin()` is a statement about the table rather than a column lookup.
- An account that fails that check is rejected with 422 **and is logged straight back out** — no
  session is left behind. Verified.
- Failed logins are rate-limited at 5 attempts per 60s, keyed on `email + IP` so an attacker cannot
  lock out a legitimate user from elsewhere.
- Invalid credentials return a deliberately generic message — no account enumeration.
- Session is regenerated on login (fixation) and invalidated on logout.
- `EnsureUserIsAdmin` runs after `auth`, so it only decides authorisation, never authentication.

## Front-End Architecture

```
routes/index.tsx
  └── <AdminBoot>                  ← mounts auth provider for /admin/* only;
        │                            releases the marketing boot cloak
        ├── /admin/login  → AdminLoginPage
        └── <ProtectedRoute>       ← redirects unauthenticated, splash while resolving
              └── <AdminLayout>    ← sidebar + header + user menu
                    └── /admin  → AdminDashboardPage
```

### Key files

| Path                                            | Role                                            |
| ----------------------------------------------- | ----------------------------------------------- |
| `admin/auth/types.ts`                            | `AdminUser`, `AuthStatus`, `LoginCredentials`   |
| `admin/auth/auth-api.ts`                         | Endpoint wrappers                               |
| `admin/auth/auth-context.ts`                     | Context + `useAdminAuth()` (no components)      |
| `shared/lib/api-error.ts`                              | `normalizeError()` — status-aware, renderable   |
| `admin/auth-provider.tsx`            | Session state, bootstrap, 401 interceptor       |
| `admin/admin-boot.tsx`               | Route boundary: provider + cloak release        |
| `admin/protected-route.tsx`          | Route guard                                     |
| `admin/admin-layout.tsx`             | Shell                                           |
| `admin/admin-nav.tsx`                | Sidebar nav (config-driven)                     |
| `admin/config/nav.ts`                           | **Nav source of truth**                         |
| `admin/pages/login.tsx`, `admin/pages/dashboard.tsx` | Screens                                    |

### Design decisions worth knowing

- **The provider mounts only under `/admin/*`.** Public visitors never trigger a session request.
- **`auth-context.ts` holds no components** so React Fast Refresh stays happy — the ESLint config
  enforces `react-refresh/only-export-components` outside `components/ui`.
- **A 401 from any admin request clears client auth state** via an axios interceptor, so an expired
  session redirects instead of rendering a shell for a signed-out user.
- **`ProtectedRoute` shows a splash while `status === 'loading'`** rather than redirecting — without
  this, a hard refresh on `/admin` would bounce you to login before the session check answered.
- **The intended destination is preserved** in navigation state and restored after login.

## Theming

The admin uses a scoped `.admin-theme` class (in `app.css`) that **redefines the shadcn token names**
— `--background`, `--card`, `--border`, `--muted-foreground`, `--radius`. Because of that, every
existing primitive (`Button`, `Card`, `Input`, `DropdownMenu`) adopts the admin palette with no
per-component overrides.

It keeps the brand accent (`--brand`, the teal `#017ea8`) so the panel still reads as 50+ Voyagers,
but swaps the marketing site's warm editorial neutrals for a cooler greyscale that suits dense UI.
The marketing page is completely unaffected.

Typography is Hanken Grotesk throughout, with Spectral reserved for the wordmark.

## Responsive Behaviour

| Breakpoint      | Layout                                                        |
| --------------- | ------------------------------------------------------------- |
| `lg` and up     | Fixed 17rem sidebar, content offset by `lg:pl-68`             |
| Below `lg`      | Sidebar hidden; hamburger opens a slide-over drawer           |

The drawer is built on Radix Dialog (`components/ui/sheet.tsx`), so focus trapping, Escape, scroll
lock and backdrop dismissal are handled properly rather than approximated. Verified at 390px and
834px: no horizontal overflow, focus lands inside the drawer, Escape closes it.

## Code Splitting

The marketing site and admin panel share almost no code — one pulls GSAP/Lenis/SplitType, the other
Radix. `routes/index.tsx` lazy-loads both areas so neither pays for the other:

| Chunk          | Size (gzip) | Loaded by            |
| -------------- | ----------- | -------------------- |
| `app`          | ~94 kB      | Everyone (React core)|
| `app-layout`   | ~58 kB      | Marketing only       |
| `admin-layout` | ~32 kB      | Admin only           |

Before splitting it was a single 205 kB bundle for every visitor.

`releaseBootCloak()` deliberately lives in its own dependency-free module (`shared/lib/boot-cloak.ts`) so
the admin panel does not import GSAP just to remove a CSS class.

## Adding the Next Admin Module

The foundation is built so this is a three-step job:

1. **Route** — add the path to `routes/paths.ts` under `paths.admin`.
2. **Nav** — append an entry to `admin/config/nav.ts` (label, href, lucide icon). Grouping is
   supported via the optional `title` on a section.
3. **Page** — create `admin/pages/<module>.tsx` and register it inside the existing
   `<ProtectedRoute>` → `<AdminLayout>` nesting in `routes/index.tsx`. Lazy-load it to keep the
   admin chunk lean.

Reuse `PageHeader` for the title block and the `ui/` primitives for forms. Nothing in the layout,
sidebar, or auth needs touching.

For the API side, add a controller under `app/Http/Controllers/Admin/` and register routes inside the
existing `Route::middleware(['auth', 'admin'])` group in `routes/web.php`.

## Verification Performed

Browser-driven via CDP against the real server, on the production build:

- ✅ `/admin` unauthenticated → redirects to `/admin/login`
- ✅ Empty submit → inline field validation, no request sent
- ✅ Wrong password → banner error, password cleared, focus returned to password
- ✅ Valid login → `/admin`, dashboard renders, sidebar visible
- ✅ Hard reload on `/admin` → session persists, no redirect flash
- ✅ Tablet (834px) → sidebar hidden, hamburger shown
- ✅ Mobile (390px) → no horizontal overflow; drawer opens, traps focus, closes on Escape
- ✅ User menu opens; sign out → `/admin/login`; `/admin` then blocked
- ✅ Non-admin account rejected with no session established (API-level)
- ✅ No console errors; marketing homepage unaffected

## Known Gaps

- Statistics are **placeholder values**, labelled as sample data in the UI. There is no stats
  endpoint; `admin/pages/dashboard.tsx` marks where to swap in a real fetch.
- The dashboard `error` state is implemented and rendered but not reachable until a real request
  exists to fail.
- No "remember me" UI (the backend `LoginRequest` accepts the flag already).
- No password reset, no profile editing, no user management.
- No automated tests for the admin flow.
