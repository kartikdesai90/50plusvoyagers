# Tours Module — Development Flow, Data Design and Phase Plan

**Prepared for:** Ms. Shatakshi Misra, 50+ Voyagers
**Prepared by:** Abhi Desai
**Date:** 21 August 2026
**Version:** 1.2
**Supersedes:** Section 3 of [website-revamp-plan.md](./website-revamp-plan.md) v1.0 (17 Aug 2026)
**Status:** For client confirmation — **no schema changes made.** Structure proposed for sign-off first.

> **Resolved 2026-09-02 — the engine question in §11.1 is now settled: MySQL.** The application has
> been migrated from PostgreSQL to MySQL, which is option **A** in the §11.1 table — the reading the
> dump itself always supported. The rest of this document is kept as written, so the discussion that
> led here is still legible; where it says the application is built on PostgreSQL, or gives column
> types "in PostgreSQL form", read the MySQL equivalents column beside them. The §12 client decision
> recorded as "PostgreSQL, single database" now stands as **MySQL, single database** — the single
> database part is unchanged.

> **v1.2 — one database, and three blocking discrepancies.** You have asked that the website's new
> tables live **inside the existing CRM database**, reusing existing tables where possible, with no
> separate database and nothing broken. Section 11 is new and covers exactly that.
>
> Reading `voyagers_crm.sql` raised three things that must be settled before any table is created,
> because each one would break something if we proceeded on the instruction as written:
>
> 1. **The dump is MariaDB/MySQL, not PostgreSQL.** It is a phpMyAdmin export, `ENGINE=InnoDB`,
>    server version `10.4.32-MariaDB`. Our application is built on PostgreSQL. (11.1)
> 2. **`tb_group_tour` is not in this dump at all** — the 32-row master table is absent from the
>    seven tables exported here. (11.2)
> 3. **A `tours` table already exists**, and it is *not* the tours table this project needs — it
>    holds 1 row with 5 columns, and it is load-bearing for the feedback system. Our module also
>    needs a table called `tours`. This is a direct name collision. (11.3)
>
> v1.1 findings still stand: `tour_code` is populated and unique across the 32 rows, so the join is
> settled; `tour_website_link` is not unique; and one tour page serves several departures.

---

## 0. Why this document exists, and what changed

The revamp plan of 17 August was written on one assumption, taken from your first email:

> *"This table `tb_group_tour` is the master table in our CRM in which all group tour data is
> stored… Let's not create another table for same."*

We read that as: **the CRM holds the tours, the website reads them.** The whole of Section 3 of that
plan — read-only CRM connection, no second table, no sync — followed from it.

Your second email corrects that reading, and the correction is the single most important fact in
this document:

> *"ALL THESE / Data for individual tour page ARE IN HTML FORMAT IN THE WEB PAGE CODE. WE DO NOT
> HAVE ANY CMS SYSTEM CURRENTLY."*
> *"THERE IS NO DATA EXTRACTION/FETCH BY TOUR PAGES/WEBSITE FROM THE CRM."*
> *"YOU HAVE TO CREATE NEW TABLE FOR ABOVE TOUR PAGE DATA."*
> *"How are these details connected to `tb_group_tour` — by `tour_id`, `tour_code`, or another
> field? **NO**"*

So there are **two separate bodies of tour data**, they have never been connected, and only one of
them is in a database:

| | Where it lives today | Who owns it | What it covers |
| --- | --- | --- | --- |
| **Schedule data** | `tb_group_tour` in the CRM | Your operations team | Dates, cost, nights, booking status — the commercial facts |
| **Page content** | Hand-written HTML, one file per tour (`grouptour/coorg.html`, `srilanka.html`, …) | Whoever last edited the file | Itinerary, highlights, inclusions, exclusions, images, testimonials, meta tags |

This changes the design in one specific way, and leaves the rest of the 17 August plan standing:

- **Still true:** we do not duplicate `tb_group_tour`. Schedule data is read from your CRM, read-only.
- **Now also true:** we *must* create new tables — for the page content that exists only as HTML
  today. That is not duplicating your master table. It is giving a home to content that currently
  has none.

There is no contradiction between "don't create another table" and "create new tables". The first
was about *schedule* data, which you own in the CRM. The second is about *page* content, which you
own in HTML files that nobody can edit without a developer. **This document proposes exactly one new
body of data, and it is the half the CRM has never held.**

> **The join has to be built — but the material for it is already there.** You told us there is no
> field linking a CRM row to an HTML page, and as a *stored relationship* that is correct: nothing
> in `tb_group_tour` points at a page, and nothing in a page points back. What the dump shows,
> though, is that `tour_code` is populated and unique on all 32 rows and encodes the destination
> (`Coorg30052026`, `Ladakh19082026`). So the link can be **derived** rather than waiting on a CRM
> change. Building it is still the central piece of work — Section 3.3 — but it no longer blocks
> anything, and it needs nothing from your CRM team.

---

## 1. Business logic — what the site must actually do

Stated as rules, before any table or endpoint, because the rules are what we would be testing
against later.

### 1.1 The homepage "Upcoming Tours" section

| # | Rule | Source |
| --- | --- | --- |
| 1 | Show tours from `tb_group_tour`, not from a website-owned copy | Your email, confirmed |
| 2 | Display exactly four fields: `tour_short_name`, `tour_start_date`, `package_cost`, `tour_nights` | Your email, confirmed |
| 3 | A tour disappears when it is finished | Your email — but see the discrepancy in 1.2 |
| 4 | No Comfort / Deluxe tag chips — not in use yet | Your email, confirmed |
| 5 | Month tabs are built from tours that actually exist; a month with no departure gets no tab | Design |
| 6 | A card links to that tour's own page | Via `tour_website_link`, which every row carries (3.3) |

### 1.2 "Finished" — the one rule we cannot implement as written

Your instruction: *"When `tour_booking_status = 'Completed'`, then the tour should disappear."*

In the CRM dump you shared, `tour_booking_status` only ever holds `Booking Open` or `Booking Closed`.
The value `Completed` appears in a **different column** — `tour_status`.

Implementing your sentence literally would hide nothing at all, because no row ever reaches that
value in that column. We are flagging it rather than quietly "fixing" it, because a tour that will
not disappear is exactly the kind of bug that is noticed six weeks late by a customer.

**Proposed rule** — implemented unless you say otherwise:

```
A tour is shown when:
    tour_status = 'Active'
  AND tour_start_date >= today
```

This is deliberately stricter than a status check alone. It means a departure that has simply *been
and gone* drops off the site by itself, even if nobody in the office remembered to change its status.
Status alone would leave last March's tour on the homepage until someone noticed.

### 1.3 Booking state

`Booking Closed` tours (7 of the 32 in your dump — Ladakh Aug, Bali Sep, Meghalaya Sep and
others) are still **upcoming departures**. They are shown, with a "Booking closed" label in place of
the enquiry button, because:

- they are genuine content for search engines, and those pages already rank;
- travellers use them to judge whether to ask about the next departure;
- hiding them would make the site look emptier than the business is.

Tell us to hide them entirely and it is a one-line change.

### 1.4 The enquiry path

Confirmed from your email — this is the **only** direction data currently flows to the CRM, and the
only one that writes anything:

```
Visitor fills the enquiry form on a tour page
        ↓
Website stores the enquiry (website database)
        ↓
Enquiry reaches the CRM  ← the existing behaviour, preserved
```

The website **never writes to `tb_group_tour`**. The connection to your master table is
SELECT-only, enforced at the database-user level, so a website-side bug physically cannot corrupt
your tour records.

---

## 2. Data flow — the whole picture on one page

```
┌──────────────────────────────┐
│  YOUR CRM  (MySQL)           │
│                              │
│  tb_group_tour               │   ← master. Website never writes here.
│   · tour_short_name          │
│   · tour_start_date          │
│   · package_cost             │
│   · tour_nights              │
│   · tour_status              │
│   · tour_website_link        │
└───────────────┬──────────────┘
                │  SELECT only, cached 5 min
                ▼
┌──────────────────────────────────────────────────────────┐
│  WEBSITE  (Laravel API + PostgreSQL)                     │
│                                                          │
│  ┌────────────────────┐        ┌──────────────────────┐  │
│  │ CRM read layer     │        │ tours                │  │
│  │ (no table of its   │◄──────►│ (NEW — page content) │  │
│  │  own; reads live)  │  join  │  · slug, title       │  │
│  └────────────────────┘  on    │  · overview, meta    │  │
│                          code  │  · images            │  │
│                                └──────────┬───────────┘  │
│                                           │              │
│                          ┌────────────────┼───────────┐  │
│                          ▼                ▼           ▼  │
│                  tour_itinerary_days  tour_ … (child tables) │
│                                                          │
│  Admin panel edits the NEW tables only.                  │
│  Nothing in the admin panel can touch the CRM.           │
└───────────────────────────┬──────────────────────────────┘
                            │  JSON
                            ▼
┌──────────────────────────────────────────────────────────┐
│  NEXT.JS FRONT END  — server-rendered                    │
│   /                      homepage, Upcoming Tours        │
│   /group-tours           the listing                     │
│   /grouptour/<name>.html each tour page (URL preserved)  │
└──────────────────────────────────────────────────────────┘
```

**The rule the diagram encodes:** commercial facts flow *out* of the CRM and are never written back.
Page content lives on the website and never enters the CRM. The two meet only at render time, joined
on a code that Section 3.3 defines.

---

## 3. Database design

### 3.1 What we are *not* creating

No copy of `tb_group_tour`. No `tour_start_date`, `package_cost`, `tour_nights` or booking status
column anywhere in the website database. Those four fields have exactly one home — your CRM — and
the website asks for them fresh every time.

This matters beyond tidiness. If we copied them, your team would eventually change a price in the
CRM and find the website still showing the old one, and nobody would know which was right.

### 3.2 What we are creating, and why each table exists

Six tables. The parent holds one row per tour page; the five children hold the repeating blocks that
your HTML files already contain, one row per repeat.

The shapes below are taken directly from the three files you sent (`coorg.html`, `srilanka.html`,
`tamilnadu.html`) — every column exists because those pages already render that content.

#### `tours` — one row per tour page

| Column | Type | Why it is here |
| --- | --- | --- |
| `id` | bigint PK | |
| `crm_match_key` | varchar(64), indexed, nullable | **The join to your CRM.** Matches the destination stem of `tour_code` (`Jog` → `Jog07072026`, `Jog21072026`). Not unique-per-departure by design — see 3.4. Nullable so a page can be drafted before any CRM row exists. |
| `slug` | varchar, unique | The address. `coorg`, `srilanka` — matching today's filenames, so URLs do not move. |
| `legacy_url` | varchar(2048), nullable | The exact old path (`/grouptour/coorg.html`), kept for redirects and verification. |
| `title` | varchar | The `<h1>`. Carried across **verbatim** — SEO rule. |
| `subtitle` | varchar, nullable | The places line: "Namdroling ● Madikeri ● Tala Kaveri…" |
| `region` | varchar(20) | `India` / `International`. Drives the listing filter. |
| `overview_html` | text, nullable | The "Highlights" prose block. |
| `ribbon_text` | varchar(80), nullable | The carousel ribbon: "Stay in Coffee Estate". |
| `booking_fee` | integer, nullable | "Pay Rs. 10000 as tour booking fee" — differs per tour (₹10,000 Coorg, ₹30,000 Sri Lanka). |
| `balance_due_days` | smallint, nullable | 10 / 30 / 60 days before departure — also differs per tour. |
| `route_map_path` | varchar(2048), nullable | The route-map image, where a tour has one. |
| `meta_title` | varchar | Carried across verbatim. |
| `meta_description` | varchar(500) | Carried across verbatim. |
| `meta_keywords` | varchar(500), nullable | Present in your HTML; preserved as-is. |
| `og_title`, `og_description`, `og_image_path` | | Preserved from the existing `og:` tags. |
| `canonical_url` | varchar(2048), nullable | |
| `status` | varchar(20) | `draft` / `published`. A page being written is not live. |
| `display_order` | integer | Editor's ordering on the listing. |
| `created_at`, `updated_at` | timestamps | |

#### `tour_itinerary_days` — the day-by-day

One row per `<h4 class="article-label base">Day N: …</h4>` block.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint PK | |
| `tour_id` | FK → `tours`, cascade delete | |
| `day_number` | smallint | |
| `heading` | varchar | "Day 1: Proceed to Coorg" |
| `title` | varchar, nullable | "Calling the Coffee Lover" |
| `body_html` | text | The day's prose. |
| `stay` | varchar, nullable | "Coffee Plantation Stay" |
| `meals` | varchar, nullable | "Lunch, Dinner" |
| `day_date` | date, nullable | Printed today ("3 May, 2026"). Nullable — see the warning below. |

> **Recommendation on `day_date`:** today each day carries a hard-coded date, which is why
> `coorg.html` says "3 May, 2026" in five places. When the tour runs again next year, all five must
> be edited by hand. We propose storing `day_number` as the truth and **deriving** the date from the
> CRM's `tour_start_date + (day_number − 1)`. One CRM change then re-dates the whole itinerary.
> `day_date` stays in the schema as an override for the rare tour that needs one.

#### `tour_highlights`

`tour_id`, `body`, `display_order`. The `<li>` bullets in the Sri Lanka highlights block. Coorg has
none — the table simply holds no rows for it, and the section does not render.

#### `tour_inclusions` / `tour_exclusions`

`tour_id`, `body_html`, `image_path` (inclusions only — your inclusion blocks each carry a thumbnail),
`display_order`.

Kept per-tour rather than as one shared list, because your files disagree: Coorg includes an AC bus
from Bangalore; Sri Lanka includes international travel insurance and excludes TCS. A shared list
would be wrong for both.

#### `tour_images`

`tour_id`, `path`, `alt`, `caption`, `is_cover`, `display_order`.

`alt` is **not nullable** — your accessibility and SEO checklist requires it, and a nullable column
is a promise nobody keeps.

This is also what answers Section 3.3 item 5 of the 17 August plan ("`tb_group_tour` has no image
column"). It has a proper home now.

#### `tour_booking_steps`

`tour_id`, `step_number`, `body_html`. The numbered "How to make booking" list. Per-tour because the
amounts and deadlines differ.

#### On testimonials

Your tour pages each carry a testimonials block. You **already have a working Feedback module** in
the admin panel. Rather than a seventh table, we add an optional `tour_id` to the existing feedback
records — one quote can then be shown on its tour's page, on the homepage, or both, and your team
manages all testimonials in the one screen they already know.

The groundwork for this is already in the codebase: `app/Support/TourChoices.php` exists and returns
an empty list until a `tours` table appears, at which point the feedback screen's tour picker starts
working with **no further change**. That was built in anticipation of this module.

### 3.3 The join — now settled by the data

This was the open question in v1.0 of this document. We have since read the full dump, and it is
**answered**: the join is `tour_code`, and no CRM change is needed to start.

| Option | What the dump actually shows | Verdict |
| --- | --- | --- |
| **A. `tour_code`** | Populated on **all 32 rows**. **Zero** empty. **Zero** duplicates. | **Confirmed — this is the join.** |
| **B. `tour_website_link`** | 32 links, but only **31 distinct** — `jog.html` appears twice. | **Rejected as the key.** It cannot identify a row uniquely. |
| **C. Manual mapping in the admin panel** | — | **Kept as the override**, for a new CRM tour whose page is not yet written. |

Unlike `tour_short_name` and `tour_nights` — which are declared in the table but missing from the
INSERT, and so are empty for every tour — `tour_code` is **real, complete data**. It carries values
like `Coorg30052026`, `Ladakh19082026`, `SpainPortugal23092026`: destination plus departure date,
which is exactly what a departure key should be.

**This removes the one item that was blocking Phases 2 and 3.** We no longer need anything from your
CRM team to build the join.

One small thing to note rather than fix quietly: row 440's code is `' Kinnaur06062026'` — with a
**leading space**. Harmless once trimmed, and we trim on both sides of the comparison, but worth your
team knowing since a space is invisible in a CRM screen and would break an exact-match search.

### 3.4 One page, many departures — a correction to the model

The dump shows something that changes the shape of the relationship, and it is easier to design for
now than to retrofit later:

```
tour_id 442 · Jog07072026 · 7–10 July 2026  ─┐
                                              ├─→  /grouptour/jog.html   (one page)
tour_id 445 · Jog21072026 · 21–24 July 2026 ─┘
```

Two CRM departures, one tour page. The itinerary, highlights, inclusions and photographs are
identical; only the dates and the booking state differ.

So the relationship is **one tour page → many CRM departures**, not one-to-one. The schema in 3.2
handles this correctly, with one adjustment:

- `tours.crm_tour_code` is **not** the right place for the link, because a page may match several
  codes. It stays for the simple majority case but is no longer the mechanism.
- The real match is on the **page identity** — a `tours.crm_match_key` (e.g. `Jog`, `Coorg`,
  `Ladakh`), against which every CRM departure whose `tour_code` begins with that key is grouped.
- A tour page therefore renders **all** its upcoming departures — "7–10 July" and "21–24 July" both
  shown, each with its own price and booking state — rather than arbitrarily picking one.

This is also better for you commercially: a visitor landing on the Jog page sees both dates and can
pick, instead of seeing one and assuming the other does not exist.

The homepage Upcoming Tours section is unaffected — it lists **departures**, so two Jog departures
correctly appear as two cards.

> **The one question this raises for you:** should the two Jog departures show as two cards on the
> homepage (our assumption, and what the CRM implies), or be collapsed into one "Jog Waterfall —
> July, two dates" card? We proceed with two cards unless you prefer otherwise.

### 3.5 What the dump confirmed, changed, or left open

Read directly from the 32 rows, so none of this is inference:

| Finding | Detail | Effect |
| --- | --- | --- |
| `tour_code` complete and unique | 32/32 populated, 0 duplicates | Join **settled** (3.3) |
| `tour_website_link` not unique | 31 distinct across 32 rows | Rejected as key (3.3) |
| One page serves many departures | `jog.html` × 2 | Model corrected to one-to-many (3.4) |
| `tour_status` values | `Active` (27), `Completed` (5) | Confirms the 1.2 rule reads the right column |
| `tour_booking_status` values | `Booking Open` (20), `Booking Closed` (12) | Confirms `Completed` **never** appears here — 1.2 stands |
| `Active` + `Booking Closed` | 7 rows | Real and common; 1.3 matters |
| `tour_short_name` | Not in the INSERT — empty for all 32 | Fallback to `tour_name` required |
| `tour_nights` | Not in the INSERT — empty for all 32 | Calculate from the date range |
| `'0000-00-00'` dates | Present in `early_bird_discount_date` | Must be handled as "no date" |
| Encoding damage **in the CRM too** | `Jog Waterfall 7 â€“ 10 July` — a real stored value | Not only an HTML problem (4.2) |
| `tour_category` | `Domestic` / `International`, clean on all rows | Use it for `region` — no guessing needed |
| `tour_days` | Present alongside `tour_nights` | A second fallback for duration |

Two of these deserve a sentence more.

**The encoding damage is in your CRM, not just your HTML.** `tour_name` for rows 442 and 445 contains
`â€“` where an en-dash belongs. We had flagged this for the HTML files; it is in the database as
well. We repair it on read, so nothing displays broken — but the underlying CRM values stay as they
are unless your team cleans them, and we do not write to your table.

**`tour_category` is clean, and that is genuinely useful.** It means the India/International split on
the listing is driven by your own data rather than by a mapping we maintain. Every row has a valid
value.

### 3.6 Data quality items still outstanding

From the 17 August plan, unchanged and still needing action. Repeated here because two of them are
fields you asked us to display:

| Field | Problem | Handling |
| --- | --- | --- |
| `tour_short_name` | Declared in the table, **absent from the INSERT** — empty for all 32 tours | Fall back to `tour_name`. **Request:** populate it — it controls how every card reads. |
| `tour_nights` | Same — declared, empty | Calculate from `tour_end_date − tour_start_date`. |
| `early_bird_discount_date` | Holds `'0000-00-00'` in several rows | Treated as "no date". Handled defensively so it cannot throw. |
| `tour_booking_status` vs `tour_status` | See 1.2 | Proposed rule stated; awaiting your confirmation. |

---

## 4. The content migration — 32 pages of HTML into the database

This is the largest single piece of work, and it is the part most likely to be underestimated. It is
**not** a copy-paste job, and it is not something to do by hand 32 times.

### 4.1 How it is done

A one-time **importer script**, run repeatedly until its output is right, then run once for real:

1. **Parse** each `grouptour/*.html` file — the structure is consistent across all of them (the same
   Bootstrap template), so the itinerary days, inclusions, exclusions, highlights and booking steps
   are each found by a stable selector.
2. **Extract** the meta block verbatim — `<title>`, description, keywords, `og:` tags, `<h1>`.
   Character-for-character. This is the SEO-critical step.
3. **Write** to the new tables, one tour per file.
4. **Report** — every file, every field, extracted or flagged. Anything the parser is unsure of is
   listed for a human rather than guessed at.
5. **Review** — your team checks a sample against the live pages before we go further.

The script lives in the repository (`php artisan tours:import`), is re-runnable, and is idempotent —
running it twice does not create 64 tours.

### 4.2 The known-messy parts

We read the three files you sent closely. These will need hand-finishing, and we would rather say so
now than discover them mid-migration:

- **Unclosed and mis-nested tags.** `coorg.html` has stray `</li>` after several `</ul>` blocks, and
  `srilanka.html` has a `<p>` opened and never closed inside Day 2. Browsers forgive this; parsers
  need a forgiving mode, which is what we will use.
- **Encoding damage.** `â` appears throughout where an em-dash, a curly apostrophe or a `₹` should
  be — "Coorg â Scotland of India", "Gandhiâs age". This is UTF-8 read as Latin-1, and it is
  already visible on your live pages. We repair it during import; it is a genuine content
  improvement that changes no wording.
- **Unquoted HTML attributes.** `content=http://…` without quotes in the `og:` tags, and
  `og:site_name` in `coorg.html` is missing its closing quote entirely — which means that tag is
  currently malformed in the live page.
- **A stray PHP include** in `srilanka.html` and `tamilnadu.html` (`<?php include("footer2.html"); ?>`)
  sitting in a file served as HTML. Dropped — the new site has a real footer component.
- **Inconsistent image folder casing** — `images/Tamilnadu/`, `images/srilanka/`, `images/coorg/`.
  Case-sensitive on a Linux server in a way it was not on Windows. Normalised at import.
- **A wrong `alt` attribute** — in `tamilnadu.html`, the image `mahabalipuram-Senior-Citizen-Tour.jpg`
  is captioned "Chettinad Mansion at Karaikudi". One of the two is wrong. Flagged for your team, not
  silently changed.
- **Stale copyright** — `tamilnadu.html` says 2014-2025, the other two say 2014-2026. Handled by the
  shared footer, which has one value.

### 4.3 What is deliberately dropped

Not carried across, because it is dead weight rather than content: Google Analytics `analytics.js`
(replaced by GA4), the Facebook Pixel block, jQuery, Bootstrap 3, the `<font color="orange">` tags,
the commented-out "Member Benefits" blocks, and the IE8 conditional stylesheets.

**No visible content is dropped.** Every heading, paragraph, list item, testimonial and meta tag
survives. If it renders on your page today, it renders on the new one.

---

## 5. SEO — what is different now, and what is not

The 17 August plan's Section 4 stands in full: the crawl baseline, the redirect map, the launch
checklist, the 14-day monitoring, the six-month rollback window. None of that changes.

Three points are worth restating because this document changes their basis:

**URLs do not move.** We keep `/grouptour/coorg.html` exactly as it is. Next.js serves that address
directly — an `.html` extension is just a string in a route, and there is no technical reason to
prefer a prettier URL. Your CRM's `tour_website_link` values keep working untouched, and there is no
redirect to get wrong for the pages that rank.

**Meta tags, H1 and H2 stay frozen.** The importer copies them verbatim. Because they are now
*database rows* rather than *lines in a file*, your team can change them later without a developer —
but the migration itself changes nothing. Migrate first, improve second.

**Tour pages gain structured data.** `Trip` / `Product` schema, driven by the live CRM departure date
and price, so Google can show them as rich results. This is new capability, and it is additive — it
cannot cost ranking.

---

## 6. Phase-wise development plan

Each phase ends in something that can be looked at and signed off. Nothing here is a big-bang
delivery.

### Phase 0 — Confirmations *(blocking; no code)*

| # | Needed from you | Blocks |
| --- | --- | --- |
| ~~1~~ | ~~Confirm the join strategy~~ | **Resolved from the dump — `tour_code`. Nothing needed from you.** (3.3) |
| 2 | Confirm the "hide when finished" rule (1.2) | Phase 2 — default proposed |
| 3 | CRM database access — host, and a **SELECT-only** user on `tb_group_tour` | Phase 2 |
| 4 | Google Search Console access (read-only) | Phase 5 |
| 5 | Confirm `Booking Closed` tours are shown, not hidden (1.3) | Phase 2 — default proposed |
| 6 | Confirm all 32 tour HTML files + the `images/` tree are what we migrate | Phase 3 |
| 7 | Two Jog departures — two cards or one combined card? (3.4) | Phase 2 — default proposed |

**Only items 3 and 6 now block real work.** Item 1 is closed by the dump, and 2, 5 and 7 have stated
defaults we proceed on unless you tell us otherwise.

### Phase 1 — Schema and admin foundation

Migrations for the six tables; Eloquent models with relationships; form-request validators; the
admin CRUD screens, following the pattern the Blog and Gallery modules already use. Tour pages become
editable by your team without a developer — for the first time.

**You see:** a working admin screen where a tour can be created, edited and previewed.

### Phase 2 — CRM read layer

The SELECT-only connection; the query implementing the 1.2 rule; 5-minute caching with
last-good-data fallback; the four fields formatted for display; month tabs from live data; the join
from 3.3.

**You see:** the homepage Upcoming Tours section showing live CRM tours, on staging.

### Phase 3 — Content migration

The importer; a dry run with a full extraction report; your team reviews a sample; the real run;
hand-finishing of the items in 4.2.

**You see:** the extraction report, then all 32 tours in the admin panel with their content intact.

### Phase 4 — Front end

Tour listing and tour detail pages rendering from the new tables joined to live CRM data; enquiry
form wired to the existing CRM path; `Trip` schema markup; the old `.html` addresses answering
correctly.

**You see:** every tour page on staging, side by side with the live page for comparison.

### Phase 5 — SEO migration and launch

The crawl baseline, redirect map for your sign-off, the launch checklist executed line by line, and
the 14-day monitoring. Exactly as set out in the 17 August plan.

**You see:** the redirect map for sign-off, then the launch, then the monitoring reports.

### Phase 6 — Handover

The ten deliverables you listed, plus the SEO pack. Documentation is written **as each phase
completes**, not assembled at the end.

### Sequencing

Phase 1 can start immediately — it depends on nothing from the CRM. Phases 2 and 3 run in parallel
once Phase 0 clears, because one needs CRM access and the other needs only the HTML files. Phase 4
needs both. Calendar dates go against these once Phase 0 items 1–3 are answered; committing to dates
before that would be guessing.

---

## 7. Engineering standards

Your seven requirements, and where each is already enforced by tooling rather than by intention:

| Your requirement | How this module meets it |
| --- | --- |
| Well commented | Every file carries a header saying what it is for and why it is built that way. This is the existing convention throughout the codebase — read any current model or controller. |
| Not broken or disconnected | Every change passes build, lint, type-check and tests before deploy. The importer is re-runnable and reports rather than guesses. |
| Proper JS/CSS structure | Tailwind v4, brand tokens declared once in `app.css`. No colour or spacing hardcoded in a component. |
| Naming, structure, formatting | ESLint (zero warnings), Prettier, TypeScript strict, Laravel Pint. The build **fails** on violation. |
| Error handling and security | CRM credentials in `.env`, never in Git. SELECT-only database user. Parameterised queries throughout. CSRF on every form; validated uploads; rate-limited login; branded error pages, never a stack trace. |
| Functions / components | Controllers, form requests, API resources, Eloquent models; small single-purpose React components. The six tables map to six models with real relationships, not one wide table. |
| Version controlled | Git. Feature branches, reviewed before merge, tagged releases. |

---

## 8. Risks specific to this module

| Risk | Likelihood | Impact | Handling |
| --- | --- | --- | --- |
| ~~`tour_code` is empty like `tour_short_name` was~~ | **Closed** | — | Verified against the dump: 32/32 populated, 0 duplicates. This was the top risk in v1.0 and it no longer exists. |
| A new CRM tour has no matching page | Moderate | Medium — a card links nowhere | The card links to the listing rather than a 404, and the admin panel flags "CRM tour with no page" so your team can see it. |
| Importer mis-parses a page | Moderate | Medium | Dry run with a per-field report, human review of a sample, and a re-runnable script. Nothing is one-way. |
| A meta tag changes during migration | Low | **High** — direct ranking risk | Copied verbatim by script, not retyped. Diffed against the crawl baseline as a launch gate. |
| CRM unreachable | Low | Low | Cached data served; the section degrades rather than breaking the page. |
| 32 pages is more hand-finishing than estimated | Moderate | Medium | The three files you sent were read closely to find this out early (4.2). The estimate reflects them. |
| Scope creep into content rewriting | Moderate | High | Explicitly out of scope until rankings are stable, per your instruction. |

---

## 9. Open questions

1. ~~**`tour_code`**~~ — **closed.** Populated and unique on all 32 rows; it is the join. *(3.3)*
2. **The hide rule** — confirm `tour_status = 'Active' AND tour_start_date >= today`? *(1.2)*
3. **`Booking Closed`** — show with a label, or hide entirely? 7 live tours are in this state. *(1.3)*
4. **Multiple departures per page** — two Jog cards on the homepage, or one combined? *(3.4)*
5. **Itinerary dates** — derive from `tour_start_date`, or keep them typed per day? *(3.2)*
6. **All 32 tours** — migrate every one, or only the 27 that are `Active`?
7. **Testimonials** — attach to the existing Feedback module as proposed? *(3.2)*
8. **The Tamil Nadu alt-text mismatch** — which of the two is correct? *(4.2)*
9. **CRM encoding** — do you want the `â€“` damage cleaned in the CRM itself, or only repaired on
   display? We do not write to your table, so this is your team's call. *(3.5)*

10. **Database engine** — MySQL/MariaDB or PostgreSQL? The dump and your message disagree. *(11.1)*
11. **Is `tb_group_tour` in `voyagers_crm`?** It is not in the dump we were sent. *(11.2)*
12. **Approve the `web_` table prefix** — needed to avoid the `tours` collision. *(11.3)*

Defaults are proposed for questions 2–9, so nothing is blocked while we wait on those.

**Questions 10, 11 and 12 are different — they have no safe default.** They decide which engine the
migrations target, whether one database is even possible, and whether creating our tables would
break the existing feedback system. Phase 1 cannot start until they are answered.

---

## 10. Summary

- Your second email changed one load-bearing assumption: tour *page content* has never been in the
  CRM and lives only as hand-written HTML. Section 3 of the 17 August plan is superseded; the rest
  stands.
- **`tb_group_tour` is still read-only and never duplicated.** The four schedule fields have one
  home, and it is yours.
- **Six new tables** hold what the CRM has never held — itinerary, highlights, inclusions,
  exclusions, images, booking steps. Not a duplicate; a home for orphaned content.
- **The join is settled.** `tour_code` is populated and unique on all 32 rows, so the question that
  blocked v1.0 is closed — and closed from your data, not from an assumption.
- **One tour page can serve several departures** (two Jog dates share one page), so the model is
  one-to-many and each page shows all its dates.
- **32 HTML pages migrate by script, not by hand**, with meta tags copied verbatim to protect
  ranking. The messy parts are already identified.
- **URLs do not move.** `/grouptour/coorg.html` stays exactly as it is, so the pages that rank carry
  no migration risk at all.
- **The new tables can live inside the CRM database**, prefixed `web_`, with no existing table
  altered and no foreign key pointing at one — so the module can be removed entirely without a
  trace. Structure proposed in §11.4 for sign-off; **nothing has been created.**
- **Three things block that, and none has a safe default:** the dump is MariaDB while the
  instruction says PostgreSQL (11.1); `tb_group_tour` is not in the dump (11.2); and a `tours` table
  already exists that the feedback system depends on, which is the name our module needs (11.3).
- **Phase 1 previously could start immediately.** With the single-database instruction, it now waits
  on questions 10–12 — which is a day's clarification, not a delay to the project.

---

## 11. Single-database plan — new tables inside the CRM

Your instruction:

> *"This is our main PostgreSQL CRM database. Use this database as the foundation… Add only the new
> required tables to the existing CRM database. Do not create a separate database or modify/break
> existing CRM functionality. Reuse existing tables where possible and first provide the proposed
> new table structure and relationships before making changes."*

Understood, and this section is that proposal. **Nothing has been created or altered.** Three things
must be settled first, because each would break something if we proceeded as written.

### 11.1 The dump is MySQL/MariaDB, not PostgreSQL

`voyagers_crm.sql` is a phpMyAdmin export from **MariaDB 10.4.32**. Every table is
`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, and it uses `int(10) UNSIGNED`, `tinyint(3)`,
`enum('domestic','international')` and `AUTO_INCREMENT` — all MySQL syntax that PostgreSQL rejects.

Our application is configured for PostgreSQL (`DB_CONNECTION=pgsql`, database `50_plusvoyagers`).

So "our main PostgreSQL CRM database" and the file we were given do not describe the same system.
One of these is true, and the answer changes the work:

| Possibility | What it means | What we do |
| --- | --- | --- |
| **A.** The live CRM is MySQL/MariaDB; "PostgreSQL" was a slip | Most likely — the dump is unambiguous | Point the app at MySQL, **or** keep the two-database design from §2 |
| **B.** The CRM has been migrated to PostgreSQL and this dump is an old MySQL-era export | Possible | Send us a `pg_dump` and we build against that |
| **C.** A PostgreSQL CRM is planned but not yet built | Possible | Then the target does not exist yet, and we should not build against a guess |

**This is question 1 for you, and it blocks Section 11.4.** We cannot write migrations without
knowing which engine they run against — the column types differ.

### 11.2 `tb_group_tour` is not in this dump

The seven tables exported are: `tours`, `travellers`, `feedback_tokens`, `tb_feedback_responses`,
`tb_trf_contact`, `tb_trf_tokens`, `tb_trf_traveller`.

**`tb_group_tour` — the 32-row master table this entire project reads from — is not among them.**

That table is the foundation of §1, §2 and §3 of this document. So either this dump is a partial
export of a larger CRM (likely — a full CRM would have bookings, payments, enquiries), or
`tb_group_tour` lives in a different database on the same server.

Two consequences worth stating plainly:

- We still have `tb_group_tour`'s structure and all 32 rows from the earlier file, so the design in
  §3 is unaffected.
- But if the two tables are in **different databases**, then the "one database" instruction cannot
  be satisfied for the part that matters most — our new content tables would sit beside
  `tb_feedback_responses` while the tour schedule they join to sits elsewhere. A cross-database join
  is not possible in PostgreSQL without extensions, and is awkward in MySQL.

**Question 2: is `tb_group_tour` in this same `voyagers_crm` database?** If yes, please send a
complete dump. If no, please tell us which database it is in.

### 11.3 The `tours` name collision — the one that would actually break something

This is the most important finding in this section.

`voyagers_crm` **already contains a table called `tours`**:

```sql
CREATE TABLE `tours` (
  `id`         int(10) UNSIGNED NOT NULL,
  `tour_code`  varchar(50) NOT NULL,     -- UNIQUE
  `tour_name`  varchar(200) NOT NULL,
  `end_date`   date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
);
-- 1 row: (1, 'EUR-2026-001', 'European Highlights 2026', '2026-05-15', ...)
```

It is **load-bearing**. `feedback_tokens.tour_id` has a foreign key to it with `ON DELETE CASCADE`:

```sql
ADD CONSTRAINT `feedback_tokens_ibfk_2`
  FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE
```

So this small `tours` table is what the post-tour feedback email system hangs off. Deleting a row
from it silently deletes the feedback tokens for that tour.

**And our module needs a table called `tours` too** — §3.2 proposes exactly that name, and
`app/Support/TourChoices.php` in our codebase already queries `tours` expecting a `title` column
(this existing `tours` has `tour_name`, not `title`).

If we created our `tours` table in this database as designed, we would either fail outright, or —
worse, if someone "resolved" it by altering the existing table — break the feedback system.

**Proposal: prefix every new table `web_`.** Not decoration; it is what makes the instruction
"do not break existing CRM functionality" actually enforceable:

- No new table can collide with a CRM table, now or when the CRM adds one later.
- Anyone reading the schema can see instantly which tables the website owns and which are the CRM's.
- A CRM developer knows which tables are safe to change without telling us.

So `tours` → **`web_tour_pages`**. The name is also more honest: these are *pages*, and the
departures they describe live in `tb_group_tour`.

We would also update `TourChoices.php` to match — a one-line change on our side.

### 11.4 Proposed new tables — for your sign-off before anything is created

Seven tables, all prefixed `web_`, all owned by the website. **No existing table is altered.**

Types are given in PostgreSQL form; if 11.1 resolves to MySQL, the MySQL equivalents are noted in
the last column.

#### `web_tour_pages` — one row per tour page *(was `tours` in §3.2)*

| Column | PostgreSQL | MySQL equivalent | Notes |
| --- | --- | --- | --- |
| `id` | `bigserial` PK | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| `crm_match_key` | `varchar(64)` idx | same | Destination stem of `tour_code` (§3.4) |
| `slug` | `varchar(160)` UNIQUE | same | The address — `coorg`, `srilanka` |
| `legacy_url` | `varchar(2048)` NULL | same | `/grouptour/coorg.html`, for redirects |
| `title` | `varchar(255)` | same | The `<h1>`, verbatim |
| `subtitle` | `varchar(255)` NULL | same | The places line |
| `region` | `varchar(20)` | same | From `tour_category` |
| `overview_html` | `text` NULL | same | Highlights prose |
| `ribbon_text` | `varchar(80)` NULL | same | Carousel ribbon |
| `booking_fee` | `integer` NULL | `INT` | Differs per tour |
| `balance_due_days` | `smallint` NULL | `SMALLINT` | 10 / 30 / 60 days |
| `route_map_path` | `varchar(2048)` NULL | same | |
| `meta_title` | `varchar(255)` | same | Verbatim — SEO |
| `meta_description` | `varchar(500)` | same | Verbatim — SEO |
| `meta_keywords` | `varchar(500)` NULL | same | Preserved as-is |
| `og_title` / `og_description` / `og_image_path` | | | Preserved |
| `canonical_url` | `varchar(2048)` NULL | same | |
| `status` | `varchar(20)` | same | `draft` / `published` |
| `display_order` | `integer` | `INT` | |
| `created_at` / `updated_at` | `timestamp` | `TIMESTAMP` | |

#### The five child tables

All carry `web_tour_page_id` → `web_tour_pages(id)` `ON DELETE CASCADE`, and `display_order`.

| Table | Additional columns |
| --- | --- |
| `web_tour_itinerary_days` | `day_number` smallint, `heading`, `title` NULL, `body_html`, `stay` NULL, `meals` NULL, `day_date` date NULL |
| `web_tour_highlights` | `body` |
| `web_tour_inclusions` | `body_html`, `image_path` NULL |
| `web_tour_exclusions` | `body_html` |
| `web_tour_images` | `path`, `alt` **NOT NULL**, `caption` NULL, `is_cover` boolean |
| `web_tour_booking_steps` | `step_number` smallint, `body_html` |

#### Relationships

```
tb_group_tour              (CRM · read-only · never written by the website)
      │
      │  matched on tour_code stem — NOT a foreign key,
      │  because the website must never constrain a CRM table
      ▼
web_tour_pages             (NEW · website-owned)
      │
      ├──< web_tour_itinerary_days
      ├──< web_tour_highlights
      ├──< web_tour_inclusions
      ├──< web_tour_exclusions
      ├──< web_tour_images
      └──< web_tour_booking_steps

tours, travellers, feedback_tokens,          (CRM · untouched ·
tb_feedback_responses, tb_trf_*               no new FK points at them)
```

**Two deliberate design decisions, both about not breaking your CRM:**

1. **No foreign key from `web_tour_pages` to `tb_group_tour`.** A real FK would mean the CRM could no
   longer delete or re-key a tour row without the website's tables objecting. The match is resolved
   in application code instead. The website must never be able to block a CRM operation.
2. **No new foreign key points at any existing CRM table** — not `tours`, not `travellers`. Every FK
   we add is `web_*` → `web_*`. This means the entire module can be dropped with seven
   `DROP TABLE` statements and the CRM is exactly as it was.

### 11.5 Reusing existing tables — where we can, and where we should not

You asked us to reuse where possible. Assessed honestly:

| Existing table | Reuse? | Reasoning |
| --- | --- | --- |
| `tours` | **No** — but rename ours to avoid it | 5 columns, 1 row, different purpose, and load-bearing for `feedback_tokens`. Extending it with ~20 content columns would put website content inside a table the feedback system cascades from. |
| `travellers` | **Not now** | Relevant when customer login arrives — explicitly out of scope. |
| `tb_feedback_responses` | **Worth discussing** | This is real post-tour feedback with per-category ratings. It could feed the website's testimonials instead of our separate Feedback module — but it is raw operational feedback, unedited and not consented for publication. **Recommendation: do not publish it directly.** See below. |
| `tb_trf_*` (travel request forms) | **No** | Contains medical conditions, blood groups, nominee details, signatures. Nothing here should be within reach of a public website. |
| `feedback_tokens` | **No** | Internal email-token mechanics. |

**On `tb_feedback_responses` — a caution worth putting in writing.** It holds free-text comments
tied to named travellers, gathered for internal quality review. The one row in the dump is test data,
but `tb_group_tour.tour_feedback` in the earlier file contains real entries naming a traveller's
medical history and a complaint about a specific tour manager. That content must never reach a public
page. If you want CRM feedback to feed website testimonials, it needs an explicit
"approved for publication" flag and an editor's review step — which is what our existing Feedback
module already provides.

### 11.6 What we need before creating anything

| # | Question | Blocks |
| --- | --- | --- |
| 1 | **MySQL/MariaDB or PostgreSQL?** The dump says MariaDB; your message says PostgreSQL. (11.1) | All migrations |
| 2 | **Is `tb_group_tour` in this same database?** It is absent from the dump. (11.2) | The join, §2 |
| 3 | **Approve the `web_` prefix** and `web_tour_pages` instead of `tours`. (11.3) | All migrations |
| 4 | **A complete dump**, if this was a partial export | Final review |
| 5 | **Confirm no FK to CRM tables** is the right call (11.4) | Schema |
| 6 | **Who owns schema changes** in the CRM database, and what is the approval path? | Deployment |

Question 3 is the one that would break something if guessed wrong. Questions 1 and 2 determine
whether the single-database approach is even possible as described.

### 11.7 A note on migration tooling and shared ownership

One practical matter, since the website's tables would now live in a database your CRM also uses.

Our application manages its schema with Laravel migrations, which track applied changes in a
`migrations` table. Pointing it at the CRM database means adding that table there, and it means
`php artisan migrate:fresh` — which **drops every table in the database** — becomes capable of
destroying the CRM.

Our safeguards if we proceed:

- The application's database user gets rights on `web_*` tables only, plus SELECT on `tb_group_tour`.
  It cannot drop a CRM table even by mistake.
- `migrate:fresh` and `migrate:refresh` disabled in every non-local environment.
- Every migration reviewed before it runs against the shared database, and a backup taken first.

This is workable and we are comfortable with it. But it is worth your client knowing that the
two-database design in §2 avoids the risk entirely, at the cost of a cross-database read. If the
motivation for one database is operational simplicity, that is a fair trade; if it is a belief that
two databases cannot talk to each other, they can, and that is what §2 already describes.

---

## 12. Decisions taken — 1 September 2026

*Added after the client confirmed direction and re-supplied `tb_group_tour (2).sql`.*

Section 11 ended with six blocking questions. Four are now answered. This section records only the
decisions and what they change; the analysis they rest on is already in §1–§3 and is not repeated.

### 12.1 Confirmed

| # | Question (11.6) | Decision |
| --- | --- | --- |
| 1 | MySQL/MariaDB or PostgreSQL? | **PostgreSQL.** The dumps we hold are historical MariaDB exports; migrations target Postgres. |
| 2 | Is `tb_group_tour` available? | **Yes** — re-supplied, 32 rows. Re-parsed; every finding in §3.5 reproduces exactly. |
| 3 | Direction of travel | **New tables go into the existing CRM database.** One database — not a separate website DB, and not importing CRM tables into ours. |
| 4 | Which existing tables are live | Two. A current `pg_dump` is still needed to confirm which (12.2). |

Consequence: **§2's two-database design is not the chosen path.** It stays in the document as
context for why the single-database approach carries the constraints in §11.7, but the build follows
§11.

### 12.2 Still blocking

| # | Item | Blocks |
| --- | --- | --- |
| 1 | **A current `pg_dump` of the live CRM.** Both dumps we hold are MariaDB. Whether the `tours` collision (11.3) still exists in Postgres must be read from the live schema, not inferred from a MySQL-era export. | First migration |
| 2 | **Approve the `web_` prefix** and `web_tour_pages` (11.3) | First migration |
| 3 | **Confirm the visibility rule** in §1.2 — `tour_status = 'Active' AND tour_start_date >= CURRENT_DATE` | Homepage query |
| 4 | **Confirm no FK from `web_*` to CRM tables** (11.4) | Schema |
| 5 | **Schema-change ownership and approval path** (11.6) | Deployment |
| 6 | **DB grants**: full on `web_*`, `SELECT` only on `tb_group_tour` | Deployment |

Item 6 is what turns "we will not break the CRM" from an intention into something the database
enforces. It matters more here than it did under §2, because our migrations now run against the
CRM's own database.

### 12.3 One stale number corrected in §1.3

§1.3 said 9 active tours are `Booking Closed`. The cross-tab across all 32 rows is:

| `tour_status` | `tour_booking_status` | Rows |
| --- | --- | --- |
| `Active` | `Booking Open` | 20 |
| `Active` | `Booking Closed` | **7** |
| `Completed` | `Booking Closed` | 5 |

So it is 7, matching §3.5. §1.3 has been corrected in place. The reasoning is unaffected — those 7
are upcoming departures, shown with a "Booking closed" label rather than hidden.

---

*Prepared by Abhi Desai · 21 August 2026 · v1.2*
*§12 added 1 September 2026 · v1.3 · Client decisions: PostgreSQL, single database, new tables into the CRM*

