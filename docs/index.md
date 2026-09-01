# 50plusvoyagers Documentation Index

**Type:** Monolith (single cohesive codebase, two processes)
**Primary Language:** TypeScript (front end) · PHP (back end)
**Architecture:** Next.js App Router front end over a Laravel JSON API
**Project Type:** `web`
**Last Updated:** 2026-08-18

> **Read this first.** On 2026-08-18 the database moved from MySQL to PostgreSQL
> and the front end from React/Inertia to Next.js 16. See
> [Migration: PostgreSQL and Next.js](./migration-postgresql-and-nextjs.md).
> The documents below were generated before that and still describe Vite,
> Inertia and the SSR sidecar. What they say about the components and the
> motion layer is still true — those moved unchanged — and their file paths
> have since been corrected to the current `frontend/src` tree, but the
> transport they describe is not.

## Project Overview

A marketing site for **50+ Voyagers**, a small-group travel operator for travellers over fifty.
Next.js serves every address: eleven public pages rendered on the server, and an admin panel
rendered in the browser. Laravel answers with JSON and serves the files.

The back end owns four content modules — hero banners, traveller feedback, the gallery and the
journal — with the panel to manage them. The tour catalogue, the article bodies, the workshop
listings and the legal text are still typed TypeScript modules in the front end; each moves into the
database when it earns a reason to. That makes this a front-end-weighted project: most of the
interesting architecture is in `frontend/src`.

## Quick Reference

- **Tech Stack:** Next.js 16 · React 19 · TypeScript 6 · Tailwind CSS v4 · shadcn/ui · GSAP + Lenis · Laravel 13 · PHP 8.3
- **Entry Point:** `frontend/src/app/layout.tsx`, with the route tree beneath it
- **Architecture Pattern:** Server-rendered public area and a client-rendered admin panel, both Next routes, over a Laravel JSON API
- **Database:** PostgreSQL (`50_plusvoyagers`)
- **Deployment:** not configured. Two processes — `next start` for the front end, PHP-FPM for the API — with Laravel bound to localhost behind Next.

## Generated Documentation

### Core Documentation

- [Project Overview](./project-overview.md) — executive summary and high-level architecture
- [Source Tree Analysis](./source-tree-analysis.md) — annotated directory structure
- [Architecture](./architecture.md) — detailed technical architecture, design tokens, data flow
- [Component Inventory](./component-inventory.md) — catalog of every component and hook
- [Motion Layer](./motion-layer.md) — GSAP/ScrollTrigger/Lenis choreography subsystem
- [Admin Panel](./admin-panel.md) — auth design, admin architecture, theming, how to add a module
- [Development Guide](./development-guide.md) — local setup, scripts, conventions, known gotchas
- [Data Models](./data-models.md) — database schema and the front-end content model

### API Surface

Two files, both required from `routes/web.php` — not registered as an `api` group, because the
admin panel authenticates with a session cookie and needs that group's session and CSRF handling.

- `routes/admin.php` — `/api/admin/*`: authentication plus CRUD for hero banners, feedback, gallery
  and the journal. Auth design is in [admin-panel.md](./admin-panel.md#authentication-design).
- `routes/site.php` — `/api/site/home`: the hero slides, banner bands and traveller feedback the
  homepage renders. Public and read-only.

Laravel serves no HTML at all; every page address belongs to the front end.

### Client-Facing Plans

- [Website Revamp Plan](./website-revamp-plan.md) — SEO migration, CRM integration, deliverables (17 Aug 2026).
  **Section 3 is superseded** by the document below.
- [Tours Module Development Plan](./tours-module-development-plan.md) — the tours module: business
  logic, the six new content tables, the `tour_code` join to `tb_group_tour`, the HTML content
  migration, and the phase plan. Written after the client confirmed that tour *page content* has
  never lived in the CRM. Verified against the real 32-row dump.

## Existing Documentation

- [README.md](../README.md) — setup, scripts, structure. Rewritten for the current stack.

## Getting Started

### Prerequisites

- PHP **8.3+** (hard requirement — `composer.json` pins `platform.php` to 8.3.33)
- Composer 2.x
- Node.js **20.9+ or 22.x** (Next 16 requirement)
- PostgreSQL 14+, and a PHP build with `pdo_pgsql` enabled

### Setup

```bash
composer install
npm --prefix frontend install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Or in one step: `composer run setup`

### Run Locally

```bash
composer run dev     # api + queue + logs + front end concurrently
```

Or separately:

```bash
php artisan serve                 # http://localhost:8000  — the API only
npm --prefix frontend run dev     # http://localhost:3000  — open this one
```

### Run Tests

```bash
php artisan test                   # PHPUnit
npm --prefix frontend run types    # TypeScript
npm --prefix frontend run lint     # ESLint
```

## For AI-Assisted Development

This documentation exists so an agent can understand and extend the codebase without re-deriving it.

### When Planning New Features

**UI / marketing-page work:**
→ Read [architecture.md](./architecture.md) and [component-inventory.md](./component-inventory.md).
Content changes usually mean editing `frontend/src/site/data/home.ts` only — no markup changes.

**Animation / scroll behaviour:**
→ Read [motion-layer.md](./motion-layer.md) **first**. The motion system reaches into the DOM by
convention (`data-voy-group`, `.voy-divider`, `data-voy-hero-slides`); new sections must opt in or
they will not animate.

**Back-end / API features:**
→ Read [architecture.md](./architecture.md) and [data-models.md](./data-models.md). Endpoints go in
`routes/admin.php` or `routes/site.php`; keep them under the `web` group, since that is where the
session and CSRF handling the panel depends on lives.

**Full-stack features:**
→ All of the above, plus
[the migration note](./migration-postgresql-and-nextjs.md). A new public page is a directory under
`frontend/src/app/(site)/`; if it needs data, give it an endpoint in `routes/site.php` and fetch it
in the route's server component, never after boot.

---

_Documentation generated by BMAD Method `document-project` workflow (initial scan, deep level)_
