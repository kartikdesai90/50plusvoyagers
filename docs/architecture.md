> ## ℹ️ CODE SCAN, NOT THE DECISION RECORD
> This documents the codebase as scanned on 2026-08-11. The binding architecture is
> `_bmad-output/planning-artifacts/architecture.md` (no longer in this repo)
> (AD-1…AD-11) plus
> `ARCHITECTURE-SPINE.md` (no longer in this repo)
> (AD-12…AD-31). Where they disagree, those win.

# Architecture — 50plusvoyagers

**Generated:** 2026-08-10

## 1. Request Lifecycle

```
Any non-asset URL
   → routes/web.php  Route::view('/{any?}', 'app')->where('any', '^(?!build|storage).*$')
   → resources/views/app.blade.php
   → Vite bundle boots frontend/src/app.tsx
   → React Router takes over
```

Laravel contributes **no data** to the page. It is a static shell host. Consequences:

- Deep-linking works for any client route without server changes.
- Adding a genuinely server-rendered route means registering it **before** the catch-all, or
  extending the `where()` exclusion (currently only `build` and `storage`).
- SEO is client-rendered only; there is no SSR or prerendering.

### The Blade shell

`resources/views/app.blade.php` carries four things:

1. `<div id="app">` — the React mount point.
2. `@vite([...])` — CSS and JS entry tags.
3. A Bunny Fonts link for **Hanken Grotesk** (400–800) and **Spectral** (400/400i/500/600).
4. An inline **boot-cloak script** that adds `voy-boot` to `<html>` and removes it after 2.5 s.
   This hides the first paint so the intro animation owns it. It is added *from JS*, never as a
   static attribute, so a browser without scripting always sees the page.

## 2. Front-End Layering

```
app.tsx                 mount
  └── routes/index.tsx  BrowserRouter, route table
        └── SiteLayout  persistent shell; owns the motion lifecycle
              ├── SiteHeader
              ├── main → Outlet → HomePage
              │                     └── 13 section components
              │                           └── shared primitives (Section/Container/…)
              │                                 └── data/home.ts
              └── SiteFooter
```

**Rules of the layering:**

- Section components are **pure renderers**. They import content from `site/data/home.ts` and layout
  primitives from `site/components/section.tsx`. They hold no state.
- The only stateful front-end pieces are `SiteHeader` (mobile drawer) and `Hero` (carousel index).
- `paths.ts` is the single source of truth for internal URLs. Do not hard-code route strings.

## 3. Design System

All tokens live in `frontend/src/styles/app.css`. There is **no `tailwind.config.js`** — Tailwind v4 is
configured CSS-first.

### 3.1 Brand palette → shadcn tokens

The brand colours are declared once in `:root`, then mapped onto shadcn's semantic names so the
existing `Button`/`Card` primitives inherit the brand with no per-component overrides:

| Brand token      | Value     | Mapped onto                       |
| ---------------- | --------- | --------------------------------- |
| `--brand`        | `#017ea8` | `--primary`, `--ring`             |
| `--brand-deep`   | `#0f3d35` | (hover states)                    |
| `--surface`      | `#ffffff` | `--background`, `--card`          |
| `--surface-alt`  | `#f6f5f1` | `--secondary`, `--muted`, `--accent` |
| `--ink`          | `#1a1815` | `--foreground`                    |
| `--ink-muted`    | `#78756c` | `--muted-foreground`              |
| `--hairline`     | `#e8e6df` | `--border`, `--input`             |

Both naming sets are exposed as utilities — `bg-brand`, `text-ink-muted`, `border-hairline`
alongside `bg-primary`, `text-muted-foreground`.

> A `.dark` block still exists with the stock shadcn oklch values. The homepage is **light-only by
> design** (matching the reference) and nothing toggles dark mode today.

### 3.2 Fluid scale

The reference design is fluid, not breakpoint-stepped. Those `clamp()` values are registered as
theme tokens so they can be used as ordinary utilities:

| Token                   | Value                      | Utility           |
| ----------------------- | -------------------------- | ----------------- |
| `--text-display`        | `clamp(40px, 6.4vw, 82px)` | `text-display`    |
| `--text-h2`             | `clamp(30px, 4vw, 50px)`   | `text-h2`         |
| `--text-h3`             | `clamp(28px, 3.6vw, 46px)` | `text-h3`         |
| `--spacing-section`     | `clamp(56px, 8vw, 116px)`  | `pt-section`      |
| `--spacing-section-sm`  | `clamp(48px, 6vw, 80px)`   | `pt-section-sm`   |
| `--spacing-gutter`      | `clamp(20px, 5vw, 44px)`   | `px-gutter`       |
| `--container-page`      | `1180px`                   | `max-w-page`      |
| `--ease-brand`          | `cubic-bezier(.22,.61,.24,1)` | used in transitions |

Fonts: `--font-sans` = Hanken Grotesk, `--font-serif` = Spectral (`font-serif` for all display type).

**Do not replace these clamps with fixed breakpoint steps** — it would visibly diverge from the
approved design at intermediate widths.

### 3.3 `.voy-*` component classes

Written by hand in `@layer components` because their nested hover/focus/media logic is clearer as
CSS than as utility variants:

| Class group        | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `.voy-container`   | 1180px measure + fluid gutter                                   |
| `.voy-eyebrow`     | Uppercase brand-coloured kicker                                 |
| `.voy-heading`     | Serif display heading base                                      |
| `.voy-hero-*`      | Hero carousel, hover-reveal caption, badge/title/sub/link       |
| `.voy-divider*`    | Full-bleed banner, left-to-right scrim, body column             |
| `.voy-film*`       | Traveller film cards, veil, meta, play button, decorative shapes |
| `.voy-overlay`     | Generic hover-reveal overlay for cards                          |
| `[data-voy-card/img]` | Card hover zoom — **applied by the motion layer at runtime**  |

## 4. Responsive Strategy

- **Fluid first.** Most sizing is `clamp()`; breakpoints are used sparingly.
- **Grids auto-fit.** e.g. `grid-cols-[repeat(auto-fit,minmax(290px,1fr))]` — columns collapse
  naturally without explicit breakpoints.
- **Header** switches at `lg`: three-column nav above, hamburger drawer below. *(The reference had
  no mobile treatment at all and overflowed on phones; the drawer is an addition.)*
- **Touch devices** get hover-only content up front via `@media (hover: none)`, because the gallery
  literally instructs users to "hover any moment to read the story". The reference already did this
  for the hero; it was extended to the card overlays.
- **Reduced motion** is honoured throughout: CSS transitions are disabled and the entire JS motion
  layer bails out early.

## 5. Content Model

`frontend/src/site/data/home.ts` is the whole content layer. Every export is typed:

```ts
const img = (name: string) => `/images/home/${name}.jpg`;

export const trips: Trip[] = [...]
export const toasts: Toast[] = [...]
export const gallery: GalleryItem[] = [...]
export const articles: Article[] = [...]
export const films: Film[] = [...]        // `featured: true` renders the taller centre card
export const values: Value[] = [...]
export const heroSlides: HeroSlide[] = [...]
export const hostingSteps: HostingStep[] = [...]
export const pressLogos: PressLogo[] = [...]  // styled wordmarks, not logo files
export const departureMonths = [...]
export const whyPoints = [...]
export const dividers = { adventure, sorted }
export const whyImage = {...}
```

**To migrate to an API later:** keep these type definitions, replace the literal arrays with fetched
data, and the section components need no changes.

Site-level metadata (name, phone, email, nav structure, footer columns) lives separately in
`frontend/src/site/config/site.ts`.

## 6. Back-End Structure

Currently a bare skeleton. To add an API:

1. Create `routes/api.php`.
2. Register it in `bootstrap/app.php`:
   ```php
   ->withRouting(
       web: __DIR__.'/../routes/web.php',
       api: __DIR__.'/../routes/api.php',      // ← add
       commands: __DIR__.'/../routes/console.php',
       health: '/up',
   )
   ```
3. Consume it from the front end via the pre-configured client in `frontend/src/shared/lib/axios.ts`
   (base URL `VITE_API_BASE_URL`, default `/api`; sends `withCredentials` and `withXSRFToken`,
   so Sanctum-style cookie auth will work without extra wiring).

The catch-all in `routes/web.php` excludes only `build` and `storage`. `/api/*` is served by
Laravel's api route group before the web catch-all, so no change to the regex is needed — but
verify this once endpoints exist.

## 7. Build Pipeline

```
npm run build  →  tsc -b  (typecheck, no emit)  →  vite build  →  public/build/
```

- `laravel-vite-plugin` writes `public/build/manifest.json`; Blade's `@vite` reads it.
- `@` aliases to `frontend/src` in **both** `vite.config.ts` and `tsconfig.app.json` — update both
  if it ever changes.
- Dev server runs on `127.0.0.1:5173` with HMR and React Fast Refresh.

## 8. Cross-Cutting Conventions

| Concern              | Convention                                                        |
| -------------------- | ----------------------------------------------------------------- |
| Class merging        | Always `cn()` from `@/shared/lib/utils` — never string concatenation      |
| Internal URLs        | Always `paths` from `@/routes/paths`                               |
| Icons                | `lucide-react`; brand marks from `@/shared/ui/brand-icons`        |
| Component variants   | `cva` in the shadcn primitive, not ad-hoc props                    |
| Imports              | `@/` alias, never deep relative paths                              |
| Type imports         | Inline `import { type X }` (enforced by ESLint)                    |
| Formatting           | Prettier, 4-space, 100 cols, Tailwind class sorting                |
