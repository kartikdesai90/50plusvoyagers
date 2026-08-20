# 50+ Voyagers — Website Revamp Plan

**Prepared for:** Ms. Shatakshi Misra, 50+ Voyagers
**Prepared by:** Abhi Desai
**Date:** 17 August 2026
**Version:** 1.0
**Covers:** SEO migration, CRM (`tb_group_tour`) integration, CMS scope, engineering standards, deliverables

---

## 1. Answer to your first question

> *"Are you familiar with all these and will be doing it for our website?"*

Yes. Every item on the SEO migration checklist you sent is understood, and each one is already
mapped to a specific task in this plan. Section 4 reproduces your checklist point by point and states
exactly what we do for it, who does it, and when.

Two things are worth saying plainly up front, because they shape everything else:

1. **The most dangerous SEO mistake on a React project is already avoided.** Your checklist calls out
   *"Launching a React site with client-side rendering only — Google sees a blank page."* The build
   does **server-side rendering (SSR)**: the full HTML — headings, body copy, meta tags, tour cards —
   is produced on the server and sent in the first response. If you view source on any page, you see
   real content, not `<div id="root"></div>`. This is not something we add later; it is how the site
   is already put together.

2. **Ranking protection is 90% redirects and 10% everything else, and redirects need your old URL
   list.** We cannot write a redirect map from guesses. Section 4.1 lists exactly what we need from
   you (Search Console access and a crawl export) and it is the one item that genuinely blocks the
   launch date if it arrives late.

**Commitment:** the objective is *no ranking loss*, and the plan is built to hold position through
migration first, improve second. We do not attempt to improve rankings and migrate in the same move —
that is how projects lose both.

---

## 2. What already exists today

So there is no confusion about what is being built versus what is being changed:

| Area | State today |
| --- | --- |
| Public pages | Home, Group Tours (list + detail), Blog (list + detail), About, Membership, Workshops, Gift Holidays, Contact, Privacy, Terms, 404 |
| Rendering | Laravel 13 + React 19 over Inertia, **with SSR** — full HTML in the first response |
| Per-page SEO tags | Title, meta description, canonical, robots, Open Graph, Twitter card — all server-rendered |
| Styling | Tailwind CSS v4, brand tokens defined once in `resources/css/app.css` — no hardcoded colours or sizes in components |
| Responsive | Fluid design (not fixed breakpoints); tested desktop, tablet, Android, iOS |
| Admin panel | Login + dashboard, with working modules for **Hero banners, Feedback (text + video), Photo album, Blog** |
| Homepage data | Hero, banners, feedback text, feedback videos already read from the database via the admin panel |
| Upcoming Tours | **Still static front-end content — this is what Section 3 replaces** |
| Version control | Git, with the full history of the build |

So the CMS work you confirmed is largely in place. The open item on the content side is **Upcoming
Tours reading live from your CRM**, and on the launch side it is the **SEO migration package**.

---

## 3. Upcoming Tours — reading directly from `tb_group_tour`

Your instruction was clear: *"This table `tb_group_tour` is the master table in our CRM. Let's not
create another table for the same."* Agreed, and that is the design.

### 3.1 How it works

- The website reads `tb_group_tour` **directly, read-only**. No copy, no sync job, no second tour
  table, no duplicate data entry. A tour created or edited in the CRM is live on the website
  immediately (subject to a short cache, below).
- Access is through a **dedicated database user with SELECT-only rights on `tb_group_tour`**. The
  website physically cannot modify, insert into, or delete from your CRM. This protects the master
  table from any website-side bug.
- Credentials live in the server environment file (`.env`), never in code. Nothing sensitive is ever
  committed to Git.
- Results are **cached for 5 minutes** and the cache is cleared automatically. This means the
  homepage stays fast even under load, and the CRM database is not queried once per visitor.
- If the CRM is briefly unreachable, the section shows the last good data rather than an error. The
  homepage never breaks because of a CRM hiccup.

### 3.2 Fields consumed (exactly the four you specified)

| CRM column | Used on the card as |
| --- | --- |
| `tour_short_name` | Tour title |
| `tour_start_date` | Departure date (formatted, e.g. "9 Aug 2026") |
| `package_cost` | Price (formatted, e.g. "₹56,500") |
| `tour_nights` | Duration (e.g. "7 nights") |

Supporting columns read for filtering and linking only — not displayed as new content:
`tour_id`, `tour_status`, `tour_booking_status`, `tour_end_date`, `tour_website_link`.

**The Comfort / Deluxe tag chip is removed** from the card, per your note that these are not used yet.
The card layout is adjusted so it reads correctly without it.

### 3.3 Open points that need your confirmation

These come from reading the actual dump you shared, not from theory. Each has a proposed default so
work is not blocked — we will proceed on the default unless you tell us otherwise.

| # | Point | What the data shows | Proposed default |
| --- | --- | --- | --- |
| 1 | **Which column means "hide it"** | Your email says hide when `tour_booking_status = 'Completed'`. In the dump, `tour_booking_status` only ever holds `Booking Open` / `Booking Closed`. The value `Completed` appears in **`tour_status`**. | Show a tour when `tour_status = 'Active'` **and** `tour_start_date >= today`. This hides completed and past tours automatically, so a finished tour never lingers because someone forgot to change a status. |
| 2 | **`tour_short_name` is empty** | The column exists in the table structure but is **not in the INSERT statement** — so in the data you sent, it holds no value for any of the 32 tours. | Fall back to `tour_name` when `tour_short_name` is blank. **Request:** have the CRM team populate `tour_short_name` for live tours — it is the field that controls how the card reads. |
| 3 | **`tour_nights` is empty** | Same as above — declared in the structure, absent from the data. | Calculate nights from `tour_end_date − tour_start_date` when `tour_nights` is 0 or blank. |
| 4 | **Tours with `Booking Closed`** | 9 of 32 active tours are `Booking Closed` (e.g. Ladakh Aug, Bali Sep, Meghalaya Sep). | Show them, with a **"Booking closed"** label instead of a live enquiry button. They are still upcoming departures and good for SEO and for waitlist interest. Say the word and we hide them entirely instead. |
| 5 | **Card images** | `tb_group_tour` has **no image column**. | Map an image per tour by `tour_code`, managed from the admin panel (upload once, reused). A branded default image is used where no mapping exists, so a new CRM tour never shows a broken card. |
| 6 | **Where the card links to** | `tour_website_link` points at old static pages (e.g. `/grouptour/ladakh-aug.html`). | Link to `tour_website_link`. Those old URLs are 301-redirected to their new equivalents, so the link keeps working, the SEO value transfers, and the CRM stays the single source of truth for the link. |
| 7 | **Invalid dates** | `early_bird_discount_date` holds `'0000-00-00'` in several rows — a value MySQL accepts but modern code rejects. | Treated as "no date". Handled defensively so it can never cause an error. |
| 8 | **Early-bird pricing display** | `early_bird_discount`, `early_bird_discount_date`, `early_bird_status`, `senior_discount` all exist and carry real values. | **Not displayed at launch** — you specified four fields only. Ready to add as a "₹2,000 early-bird until 15 Jun" line whenever you want it. |
| 9 | **How many tours, and the month tabs** | The homepage design has month tabs (AUG '26, SEP '26 …) and a 3-card grid. | Month tabs generated from the live data — only months that actually have departures appear. Grid shows all upcoming tours for the selected month. |

### 3.4 The other homepage sections

Per your confirmation of 5 August, these are dynamic from the CMS with **static section headings**:

| Section | Heading | Content | Status |
| --- | --- | --- | --- |
| Upcoming tours | Static | Live from `tb_group_tour` (CRM) | To build — Section 3 |
| Feedback texts | Static | CMS (admin panel) | ✅ Working |
| Feedback videos | Static | CMS (admin panel) | ✅ Working |
| Photo album | Static | CMS (admin panel) | ✅ Working |
| Blogs | Static | CMS (admin panel) | ✅ Working |

Everything else on the homepage — **all meta tags, H1, H2, and every section heading — stays static
in code**, exactly as you asked. Moving them into the CMS is a later phase, and deliberately so: the
headings are the part search engines read, and freezing them through migration is what protects
ranking. We will schedule that as Phase 2 work once rankings are confirmed stable.

---

## 4. SEO migration — your checklist, answered line by line

### 4.1 Phase 1 — before development completes

| Your item | What we do | Owner | Needed from you |
| --- | --- | --- | --- |
| Crawl old site with Screaming Frog / Ahrefs | Full crawl of `50plusvoyagers.com`; export every URL with its status code | Abhi | — |
| Export all URLs, titles, meta descriptions, H1s, H2s | Exported to a spreadsheet that becomes the migration baseline and the launch verification checklist | Abhi | — |
| Export from Search Console: top pages, keywords, backlinks | Baseline snapshot of current rankings and traffic, so we can prove nothing was lost | Abhi | **Google Search Console access** (read-only is enough) |
| Save old `sitemap.xml` and `robots.txt` | Archived before anything changes | Abhi | — |
| **Lock URL structure** | Old URL kept identical wherever possible. Where a change is unavoidable, it goes into the redirect map | Abhi | Confirm the URL rules in 4.5 |
| **Keep content the same** | No content rewrite. Existing copy, titles, H1s and H2s carried across as-is | Abhi | Confirmed in your email — noted |

> **This is the critical dependency.** Without the old URL inventory there is no redirect map, and
> without the redirect map there is no safe launch. Search Console access is the single most
> time-sensitive item in this plan.

### 4.2 Phase 2 — during development

| Your item | How it is handled |
| --- | --- |
| **301 redirects for every old URL** | A redirect map file, one line per old URL, maintained in Git and reviewed with you before launch. Server-side 301 (permanent), not 302, not a JavaScript redirect. Every entry automatically tested — the test suite fails if any old URL returns 404 or a non-301. |
| Same title tags and meta descriptions | Carried across verbatim from the crawl export. **No rewriting at launch** — improvements are a separate, later exercise, as you instructed. |
| Same H1 / H2 structure | Preserved. This is exactly why the headings stay static rather than going into the CMS now. |
| All images have ALT text | Enforced. Every image renders an `alt` attribute; CMS uploads require alt text before saving. |
| Schema markup | `Organization`, `WebSite`, `BreadcrumbList` site-wide; `Article` on blog posts; `FAQPage` where FAQs exist; **`Product` / `Trip` on tour pages, driven by the live CRM data** — so departure date and price show as rich results in Google. Any existing schema from the old site is carried over. |
| Canonical tags | Already implemented and server-rendered on every page. Self-referencing, absolute URLs. |
| **SSR / SSG, not plain client-side React** | Already in place. Inertia + SSR — full HTML in the first response. Verified by "view source" on every page as a launch gate. |
| View source shows content, not `<div id="root">` | Verified per page and recorded in the test report. |
| Core Web Vitals green, LCP < 2.5s | Targets in Section 6. Measured with Lighthouse and PageSpeed Insights on real mobile, and reported. |
| Mobile responsive mandatory | Fluid responsive design, already built and tested. Section 6. |

### 4.3 Phase 3 — at launch

Launch runs as a written checklist with a named owner and a tick against every line:

- [ ] `robots.txt` uploaded, crawling **allowed** — verified live
- [ ] New `sitemap.xml` generated (auto-generated from live routes and live CRM tours, so it never goes stale) and submitted to Search Console
- [ ] Old sitemap kept in place for one month so Google discovers the redirects
- [ ] **No `noindex` anywhere in production** — automated check across every page; this is the mistake that silently kills a site, so it is checked by script, not by eye
- [ ] Google Search Console + Google Analytics 4 installed and firing on the new site
- [ ] All 301 redirects verified live against the redirect map
- [ ] No important old URL returning 404
- [ ] HTTPS enforced; `http://` and non-`www`/`www` variants 301 to the single canonical host
- [ ] Staging environment blocked from indexing (and it is `noindex` + password-protected throughout the build, so it can never compete with the live site)

### 4.4 Phase 4 — the 7 days after launch, and beyond

| Window | Activity |
| --- | --- |
| Days 1–7 | Daily Search Console check: coverage, 404s, crawl errors. Any 404 fixed with a 301 the same day. |
| Day 1 | New sitemap submitted; **URL Inspection → Request Indexing** for the top 20 pages. |
| Weeks 1–2 | Daily ranking check on your priority keywords across your key cities. Reported to you. |
| Weeks 1–4 | Old sitemap retained; redirect map monitored for hits. |
| 6 months | **Old site and hosting kept live and untouched** — the safety net. Full rollback possible at any point. |
| Month 2 onward | Only after rankings are confirmed stable do we begin *improving* titles, descriptions and content. Migration first, optimisation second. |

**Rollback plan:** the old site stays deployable for six months. If rankings move badly and the cause
is not fixable within 48 hours, we can point DNS back to the old site inside an hour. This is the
answer to *"that should not get impacted at any cost."*

### 4.5 URL structure — for your confirmation

The rule is your golden rule: **do not change a URL that ranks.** Proposal:

| Old URL pattern | New URL | Action |
| --- | --- | --- |
| `/` and `/index.html` | `/` | `/index.html` → `/` (301) |
| `/grouptour/<name>.html` | `/grouptour/<name>.html` — **kept exactly as-is** | None. No redirect, no risk. These are your ranking pages and your CRM's `tour_website_link` values. |
| Other existing `.html` pages | Same path, kept | None |
| Anything genuinely retired | Nearest relevant live page | 301 |

**Recommendation: keep the `.html` URLs.** They rank, the CRM links to them, and there is no SEO
benefit to a prettier URL that offsets the risk of moving one. If you prefer clean URLs
(`/group-tours/ladakh-august-2026`), it is entirely doable with 301s from every old URL — it is a
decision to take deliberately, with a small, real risk attached, not by default.

The full old-URL → new-URL map goes to you for sign-off **before** launch. Nothing goes live until
you have seen it.

---

## 5. Engineering standards — your seven requirements

| Your requirement | Commitment |
| --- | --- |
| **Well commented / remarks** | Every file carries a header explaining what it is for and why it is built that way; non-obvious logic is commented inline. The existing codebase already follows this — the controllers and components document their own reasoning. |
| **Not broken or disconnected at any point** | Every change goes through a build, a lint pass, type-checking and the test suite before it can be deployed. Staging is deployed and reviewed before production, every time. |
| **Proper JS/CSS structure, not hardcoded in main code** | Tailwind CSS v4 with all brand tokens (colours, typography scale, spacing) declared **once** in `resources/css/app.css`. No colour, font size or spacing value is hardcoded in a component. JS/CSS are compiled, minified, hashed bundles — no inline styles or scripts. |
| **Naming standards, structure, formatting** | Enforced by tooling, not goodwill: ESLint (zero warnings allowed), Prettier, TypeScript strict mode for the front end; Laravel Pint for PHP. The build **fails** on a violation, so standards cannot drift. |
| **Error handling and security — no hardcoded passwords or DB details** | All credentials in the server `.env`, never in code, never in Git (`.gitignore` enforces this). CRM access is a SELECT-only user. All queries parameterised — SQL injection is not possible. CSRF protection on every form; output escaped against XSS; secure session cookies; rate-limited login; file uploads type- and size-validated. Errors are logged server-side and shown to visitors as a branded page — never a stack trace. |
| **Use functions / components** | The front end is composed of small, single-purpose React components; the back end uses controllers, form-request validators, API resources and Eloquent models. Nothing is written twice. |
| **Version controlled** | Git throughout. Feature branches, reviewed before merge, tagged releases. Every deployment traceable to an exact commit. |

---

## 6. UI, performance and device support

**Responsive:** fluid design — typography and spacing scale continuously with viewport width, rather
than jumping at fixed breakpoints. Tested at 320px through 2560px.

**Tested on:**

| Platform | Browsers |
| --- | --- |
| Windows desktop | Chrome, Edge, Firefox |
| macOS desktop | Safari, Chrome |
| Android phone & tablet | Chrome, Samsung Internet |
| iPhone & iPad | Safari, Chrome |

**Performance targets** (measured on throttled mobile, reported in the Performance Report):

| Metric | Target |
| --- | --- |
| LCP (Largest Contentful Paint) | < 2.5s |
| INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Lighthouse Performance (mobile) | ≥ 90 |
| Lighthouse SEO | 100 |
| Lighthouse Accessibility | ≥ 95 |

**How those numbers are reached:** server-rendered HTML (no blank-page wait), images served in modern
formats at the right size with lazy loading below the fold, fonts preloaded, JavaScript split per
route, hashed assets cached for a year at the CDN edge, and CRM queries cached.

**Accessibility** matters more than usual for your audience. Minimum 16px body text, WCAG AA colour
contrast, full keyboard navigation, visible focus states, semantic headings, screen-reader labels,
and animation that respects the visitor's "reduce motion" setting.

---

## 7. Deliverables

> *"Please clarify what will the deliverables?"*

All ten items you listed, delivered as a documentation pack plus the source code.

| # | Deliverable | Contents |
| --- | --- | --- |
| 1 | **Source code** + setup/run/build guide | Full Git repository with history. Guide covering local setup, environment variables, build commands, and how to run the test suite — written so a developer who has never seen the project can get it running. |
| 2 | **Technical Design Document** | Architecture and request lifecycle, folder structure, API endpoint reference (method, URL, request, response, errors), rendering and SEO strategy, caching strategy, CRM integration design. |
| 3 | **Dependency / environment list** | Every PHP and JavaScript dependency with version and licence. Server requirements (PHP, MySQL, Node), full annotated `.env.example`, and the production environment specification. |
| 4 | **DB schema + ER diagram** | Schema for every website-owned table, plus an ER diagram showing how the site relates to `tb_group_tour`. The read-only boundary is drawn explicitly on the diagram. |
| 5 | **User authentication flow** | Admin login, session handling, CSRF, password reset, authorisation rules, and the security properties of each — with diagrams. Customer login/registration documented as a defined future phase. |
| 6 | **UI front-end details** | Component inventory, design-system tokens (colour, type, spacing), library list with licences, responsive strategy, and the device/browser support matrix. |
| 7 | **Testing details + performance report** | Test strategy, test inventory, results. Performance report: Lighthouse and Core Web Vitals per key page, mobile and desktop, before/after. Includes the redirect verification results. |
| 8 | **Deployment steps** | Step-by-step production deployment runbook, the launch-day SEO checklist (Section 4.3) as a signed-off document, rollback procedure, and backup/restore steps. |
| 9 | **Release notes** | What shipped, what changed, known limitations, and what is scheduled next. |
| 10 | **Admin / user guide** | Screenshot-led guide for your team: how to manage hero banners, feedback text and video, photo album and blog posts. Written for non-technical staff. Includes the image-mapping step for tours (Section 3.3, item 5). |

**Plus, specific to SEO migration** (not on your list, but essential):

| # | Deliverable | Contents |
| --- | --- | --- |
| 11 | **SEO migration pack** | Old-site crawl baseline (URLs, titles, meta, H1/H2). Full old → new redirect map, for your sign-off. Pre-launch ranking and traffic baseline from Search Console. Post-launch monitoring report for weeks 1 and 2. |

---

## 8. Plan of work

| Stage | Work | Depends on |
| --- | --- | --- |
| **A. SEO baseline** | Crawl old site; export URLs, titles, meta, H1/H2; pull Search Console baseline; archive old sitemap and robots | **Search Console access from you** |
| **B. CRM integration** | Read-only connection to `tb_group_tour`; Upcoming Tours reading live CRM data; month tabs; caching; tour image mapping in the admin panel | **Your answers to Section 3.3** |
| **C. SEO implementation** | Redirect map built and automatically tested; titles/meta/H1/H2 carried across verbatim; schema markup; sitemap generation; GA4 + Search Console setup | Stage A |
| **D. Hardening** | Cross-browser and cross-device testing; performance tuning to the Section 6 targets; accessibility pass; security review | Stages B, C |
| **E. Documentation** | All eleven deliverables written and handed over | Stages B, C, D |
| **F. Launch** | Redirect map signed off by you → deploy → launch checklist executed line by line → sitemap submitted → top-20 pages indexing requested | **Your sign-off on the redirect map** |
| **G. Monitoring** | Daily Search Console and ranking checks for 14 days; weekly for six weeks; old site kept live six months | Stage F |

Calendar dates are set once Stage A's dependency (Search Console access) is met, since that is what
determines when the redirect map can be finished. Stages B and C run in parallel.

---

## 9. What we need from you

| # | Item | Why it matters | Urgency |
| --- | --- | --- | --- |
| 1 | **Google Search Console access** (read-only) | Ranking baseline, top pages, top keywords, backlink data. Without this we cannot prove we held position, and cannot build a complete redirect map. | **Blocking — needed first** |
| 2 | **Answers to Section 3.3** (9 items) | Defines what the Upcoming Tours section shows. We will proceed on the stated defaults if we do not hear otherwise. | High |
| 3 | **CRM database read access** — host, SELECT-only user on `tb_group_tour` | The live tour data. | High |
| 4 | **`tour_short_name` and `tour_nights` populated** in the CRM for live tours | These are two of the four fields you asked us to display, and they are empty in the data shared. Fallbacks are in place, but the CRM values will always read better. | High |
| 5 | **Google Analytics access** (or confirmation to create a fresh GA4 property) | Traffic baseline and post-launch monitoring. | Medium |
| 6 | **Confirmation on URL structure** (Section 4.5) | Keep `.html` URLs, or move to clean URLs. Recommendation: keep. | Medium |
| 7 | **Priority keyword list and target cities** | So we monitor the terms that actually matter to your business, not the ones we guess at. | Medium |
| 8 | **Per-tour images**, or approval to reuse the existing library | Card imagery. `tb_group_tour` carries no image column. | Medium |
| 9 | **Production hosting and DNS access** | Deployment. | Before launch |
| 10 | **Sign-off on the redirect map** | Launch gate. Nothing goes live without it. | Before launch |

---

## 10. Risks, stated honestly

| Risk | Likelihood | Impact | How it is handled |
| --- | --- | --- | --- |
| Ranking dip in the first 1–2 weeks after launch | Moderate | Recovers | A small, temporary fluctuation is normal on any migration as Google re-crawls, even a perfect one. It is not the same as a ranking loss. We monitor daily and can distinguish the two. A dip that is not recovering inside two weeks triggers investigation, and rollback if needed. |
| A missed old URL 404s | Low | High if unnoticed | The redirect map is derived from a full crawl, not from memory, and every entry is automatically tested. Search Console is checked daily post-launch to catch anything the crawl missed. |
| CRM database unreachable | Low | Low | Cached data is served; the section degrades gracefully rather than breaking the homepage. Alerting if it persists. |
| CRM data quality (empty `tour_short_name`, `'0000-00-00'` dates) | **Confirmed present** | Medium | Fallbacks for every field (Section 3.3). Requesting CRM-side cleanup for the fields that drive the display. |
| Old-URL inventory arrives late | Moderate | High — moves the launch date | Flagged as the top dependency. Everything else can proceed in parallel; this one cannot be worked around. |
| Content rewrite pressure before launch | Low | High | Explicitly out of scope until Month 2, per your instruction. Content and metadata stay frozen through migration. |
| `noindex` left on production | Low | Severe | Checked by automated script across every page as a launch gate, not by eye. Staging is password-protected throughout, so it can never be indexed. |

---

## 11. Out of scope for this phase

Stated so expectations are shared, and so each can be planned properly later:

- Moving meta tags, H1/H2 and section headings into the CMS — deliberately deferred until rankings are confirmed stable (Section 3.4)
- Content rewriting or SEO copy improvement — Month 2 onward, once position is held
- Customer login / registration and online booking — the header link is a placeholder today
- Comfort / Deluxe tour tags — not in use yet, per your note
- Early-bird and senior discount display — data is available and ready whenever you want it shown
- Writing to the CRM from the website — the connection is deliberately read-only
- Multi-language and payment gateway

---

## 12. Summary

- **Your SEO checklist is fully understood and fully covered.** Section 4 answers it line by line.
- **The single biggest React SEO risk is already handled** — the site is server-rendered, and view-source shows real content on every page.
- **`tb_group_tour` is read directly, read-only. No duplicate table, no sync, no double data entry.** Your four fields, exactly as specified, with the Comfort/Deluxe chip removed.
- **Nine data points need your confirmation** (Section 3.3) — including a real discrepancy between `tour_booking_status` and `tour_status`, and two of your four display fields being empty in the data shared. Defaults are proposed for all nine so nothing is blocked.
- **Meta tags, H1, H2 and section headings stay static**, as you asked, for exactly the reason you asked it.
- **All ten deliverables you listed will be delivered**, plus an SEO migration pack.
- **The old site stays live for six months.** Full rollback is possible at any point.
- **Search Console access is the one thing that blocks the timeline.** Everything else can start now.

Happy to walk through any section on a call.

---

*Prepared by Abhi Desai · 17 August 2026 · v1.0*
