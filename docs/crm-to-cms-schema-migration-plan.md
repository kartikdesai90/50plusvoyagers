# CRM → Dynamic Website: Database Migration & Schema Plan

**Prepared:** 14 September 2026
**Status:** For review. **No schema changes have been made by this document.**
**Inputs read:** `voyagers_crm.sql` (7 tables), `tb_group_tour (2).sql` (32 rows), the 14 Sept 2026 static-site audit, and the live `50_plusvoyagers` development database as it actually stands today.

---

## 0. Read this first — the one decision that blocks everything

The audit document and the code you have already shipped **disagree about what `tours` is**. They cannot both be built. Nothing else in this plan can be finalised until you pick one.

| | **Audit's proposal (§2.4.7)** | **What your codebase already does** |
|---|---|---|
| `tours` | Evergreen product — Kerala the *destination*, no dates | The CRM's 5 columns verbatim — `tour_code`, `tour_name`, `end_date` — one row per *departure* |
| Dates & price | New `tour_departures` table, CMS-owned, with `price_twin_sharing` etc. | Not stored at all. Read live from `tb_group_tour` via `CrmDepartures` |
| Rationale | Kills itinerary duplication across `bhutan.html` / `bhutan-oct.html` | *"A copy of a price is a price that can be wrong"* |

Both are correct about different risks. The audit is right that one itinerary written twice will drift. Your code is right that a cached price will go stale and quote a traveller the wrong number.

**My recommendation: adopt the audit's split, with your code's read-only discipline preserved.** Section 3 sets out exactly that hybrid, and it is what the rest of this plan assumes. The reasoning:

- The duplication is real and already costing you. `tb_group_tour` has **two Ladakh departures, two Jog, two Bali, two Bhutan, two Meghalaya, two Arunachal, two Andaman, two Kinnaur** — 8 destinations carrying 16 departures between them, each currently pointing at a *separate HTML file with the itinerary retyped*.
- Your no-copy principle survives intact, because in the hybrid **`web_tour_departures` still never stores the selling price**. It stores the schedule identity and CMS-only fallbacks; price, seats and booking status stay read-only from `tb_group_tour`.
- The cost is one migration that splits 4 existing rows, plus a re-key of 92 child rows. That is small **today** and grows with every tour you migrate. Doing it after 32 pages are loaded is a different job entirely.

**If you reject the split**, say so and I will rework §3 — the rest of the plan (media, SEO, leads, packages, events, consent) is unaffected, since none of it depends on that choice.

---

## 1. What the legacy CRM actually contains

### 1.1 The two dumps are different databases

This tripped up the earlier plan and is worth stating plainly.

| Dump | Tables | What it is |
|---|---|---|
| `voyagers_crm.sql` | `tours`, `travellers`, `feedback_tokens`, `tb_feedback_responses`, `tb_trf_contact`, `tb_trf_tokens`, `tb_trf_traveller` | The **post-tour feedback and travel-request-form** system. MariaDB 10.4.32. |
| `tb_group_tour (2).sql` | `tb_group_tour` only | The **operational tour schedule** — 32 departures. The table the website actually needs. |

`tb_group_tour` is absent from `voyagers_crm.sql`. Either it lives in another database on the same server, or that export was partial. **This is still an open question** (§9, Q2) and it decides whether the website can join to it in SQL at all or must do so in application code.

### 1.2 Table-by-table assessment

| Legacy table | Rows | Verdict | Reasoning |
|---|---|---|---|
| **`tb_group_tour`** | 32 | ✅ **Reuse, read-only. Never write.** | The single most valuable asset in the legacy system. Schedule, price, discounts, room inventory, tour manager, and `tour_website_link` — which is a ready-made legacy-URL map. |
| **`tours`** (CRM) | 1 | ⚠️ **Leave untouched. Do not extend, do not rename.** | Load-bearing: `feedback_tokens.tour_id` cascades from it. Extending it would put website content inside a table the feedback mailer deletes from. |
| **`travellers`** | 1 | ⏸ **Out of scope now.** | Relevant only when member login is built. |
| **`feedback_tokens`** | 1 | ❌ **No reuse.** | Internal email-token mechanics. |
| **`tb_feedback_responses`** | 1 | ⚠️ **Read for insight, never publish.** | 10 rating dimensions — genuinely useful analytics. But it is raw, unconsented, and names staff. See §1.4. |
| **`tb_trf_contact`** | 0 | 🚫 **Never reachable from the website.** | Emergency contacts, nominee name and DOB. |
| **`tb_trf_traveller`** | 0 | 🚫 **Never reachable from the website.** | Medical conditions, medicines, blood group, signature image. |
| **`tb_trf_tokens`** | 4 | ❌ **No reuse.** | Token mechanics. |

### 1.3 What `tb_group_tour` gives you that the audit did not know about

The audit was written from a web crawl and so lists several fields as "missing" that **already exist in the CRM**. Reusing them is free data:

| CRM column | Audit called it | Use |
|---|---|---|
| `single_supplement_cost` | Missing field #4 | Already populated on 20 of 32 rows |
| `tour_advance` | Missing field #5 (`booking_fee_amount`) | Real per-tour values: ₹5,000 to ₹2,50,000 |
| `early_bird_discount` + `early_bird_discount_date` | Not identified at all | Powers a real countdown, not marketing prose |
| `tour_category` | `scope` domestic/international | Exactly the audit's `scope` enum |
| `total_rooms_booked`, `rooms_details`, `room_available` | Missing #3 (`min/max_group_size`) | **Internal only** — see §1.4 |
| `tour_manager_name` | Missing table (`crm_tour_managers`) | Already recorded on 28 of 32 rows |
| `tour_website_link` | `redirects` table | **The legacy URL map, already written.** 32 of 32 rows. |
| `tour_booking_status` | Hard-coded HTML badge | `Booking Open` / `Booking Closed`, already maintained |
| `trf_link` | Not identified | Links to the CRM's own form. Not for public use. |

`tour_website_link` deserves emphasis: **your entire `redirects` seed already exists** as a CRM column. That is the audit's "do this first, rankings are not recoverable" task, solved by a `SELECT`.

### 1.4 Three columns that must never reach a public page

This is the most important safety finding in the document.

1. **`tb_group_tour.tour_feedback`** is free text and contains, verbatim in row 444: a named traveller's knee injury and prior accident, a complaint about a specific tour manager, and a room dispute. Row 439 names a driver as "rude". **This column must be excluded from every API resource and every sync.** Do not select it with `SELECT *`.
2. **`rooms_details` / `room_available` / `operations`** are internal ops notes — *"After 6 bookings check with Vaibhav for room availability"*, *"REMOVE EARLY BIRD on 6/5/26"*. Useful for deriving scarcity, never for display.
3. **`tb_trf_traveller`** — medical conditions, medicines, blood group, signature path. The website's DB user should not hold `SELECT` on it at all (§8).

---

## 2. Where the website stands today

Read from the live `50_plusvoyagers` database, not inferred.

**Built and populated:** `tours` (4), `tour_itinerary_days` (25), `tour_list_items` (40 — highlight/inclusion/exclusion), `tour_booking_steps` (27 — booking/documents/guidelines), `feedback` (9), `gallery_items` (10), `blog_posts` (15), `hero_banners`, `site_settings`, `why_us_sections`, `who_we_are_cards`. Plus `tb_group_tour` as a **local fixture** (7 rows, carrying `is_local_fixture`).

**Still hard-coded TypeScript, not in any database:**

| Front-end module | Lines | Audit target |
|---|---|---|
| `gift-holidays.ts` | 118 | `packages` + `package_variants` |
| `workshops.ts` | 140 | `events` + `event_batches` + pricing tiers |
| `tours.ts` | 584 | Mockup catalogue + the generated-itinerary fallback |
| `legal.ts`, `about.ts`, `home.ts` | 790 | `pages` + `page_sections` |

**Two consolidations your code already made, which the audit did not anticipate and which I recommend keeping:**

- `tour_list_items` merges highlights + inclusions + exclusions behind a `kind`. The audit proposes three tables (`highlights`, `inclusions`, `exclusions`). **Keep the merge** — the audit's separate `inclusions.media_id` was the only structural difference, and your design dropped that thumbnail deliberately.
- Testimonials reuse `feedback` (which already has `tour_id` and an approval step) rather than a new `testimonials` table. **Keep this too**, but see §5.3 — it needs a consent column before the DPDP trail is real.

---

## 3. The core proposal — tours and departures

This is the hybrid from §0: the audit's normalization, your code's no-copy discipline.

### 3.1 Naming: the `web_` prefix

Every website-owned table is prefixed `web_`. Not decoration — it is what makes "do not break the CRM" enforceable, and it resolves the `tours` collision without touching the CRM's table. Your current `tours` becomes `web_tours`.

### 3.2 `web_tours` — the evergreen product *(modify existing `tours`)*

Keep every page column you already have. **Remove the three CRM columns that describe a departure**, because a departure is no longer what this row is.

```sql
-- FROM the existing `tours`: keep id, slug, legacy_url, page_title, subtitle,
-- region, summary, ribbon_text, route_map_path, image_path, visa_content,
-- booking_fee, balance_due_days, meta_*, og_*, canonical_url, status,
-- display_order, timestamps.
--
-- MOVE OUT to web_tour_departures: tour_code, tour_name, end_date.
-- ADD:
  crm_match_key   VARCHAR(64)  NOT NULL,   -- 'Ladakh', 'Jog' — the join stem
  duration_days   TINYINT UNSIGNED NULL,
  duration_nights TINYINT UNSIGNED NULL,
  scope           ENUM('domestic','international') NOT NULL DEFAULT 'domestic',
  category_id     BIGINT UNSIGNED NULL,    -- → web_tour_categories
  difficulty_level ENUM('easy','moderate','challenging') NOT NULL DEFAULT 'easy',
  medical_fitness_required TINYINT(1) NOT NULL DEFAULT 0,
  fitness_note    VARCHAR(1000) NULL,
  visa_required   TINYINT(1) NOT NULL DEFAULT 0,
  insurance_max_age TINYINT UNSIGNED NULL,
  UNIQUE KEY uq_web_tours_slug (slug),
  KEY idx_web_tours_match (crm_match_key)
```

`crm_match_key` promotes to a real column what `Tour::crmMatchKey()` currently computes in PHP by regex. Same value, but indexable and editable when a CRM code does not follow the pattern.

### 3.3 `web_tour_departures` — the dated instance *(NEW)*

**The critical design rule: no selling price column.** This table holds schedule identity and CMS-only fallbacks. Price, seats and live status come from `tb_group_tour` at read time.

```sql
CREATE TABLE web_tour_departures (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  web_tour_id       BIGINT UNSIGNED NOT NULL,
  crm_tour_code     VARCHAR(100) NOT NULL,   -- 'Ladakh19082026' — business key, NOT an FK
  crm_tour_id       INT NULL,                -- tb_group_tour.tour_id, soft link
  tour_name         VARCHAR(200) NULL,       -- the CRM's departure name, carried across
  legacy_slug       VARCHAR(191) NULL,       -- 'ladakh-aug', from tour_website_link
  start_date        DATE NULL,
  end_date          DATE NULL,
  departure_city    VARCHAR(100) NULL,
  -- Fallbacks ONLY. Used when the CRM is unreachable, never preferred over it.
  fallback_price    DECIMAL(12,2) NULL,
  fallback_status   VARCHAR(30) NULL,
  price_is_stale_after DATETIME NULL,        -- past this, show "on request" not a stale number
  status_override   TINYINT(1) NOT NULL DEFAULT 0,
  is_visible        TINYINT(1) NOT NULL DEFAULT 1,
  status            VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at        TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wtd_code (crm_tour_code),
  KEY idx_wtd_tour (web_tour_id, start_date),
  KEY idx_wtd_listing (status, is_visible, start_date),
  CONSTRAINT fk_wtd_tour FOREIGN KEY (web_tour_id)
    REFERENCES web_tours(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

`price_is_stale_after` is the answer to your no-copy objection. A fallback that is allowed to age indefinitely becomes a lie; one that expires into "price on request" degrades honestly.

**No foreign key to `tb_group_tour`.** The website must never be able to block a CRM delete.

### 3.4 Re-keying the child tables

`tour_itinerary_days`, `tour_list_items` and `tour_booking_steps` currently hang off `tours.id`. After the split they hang off **`web_tours.id`** — itinerary content is evergreen and belongs to the product, not the departure. That is the entire point of the split: one Ladakh itinerary, two departures.

Only rename the FK column (`tour_id` → `web_tour_id`); shape is otherwise unchanged, and the existing `content`/`kind`/`day_number` columns are already right.

### 3.5 The migration, in order

Your 4 rows map cleanly — none is a duplicate destination yet, which is exactly why now is cheap:

| Existing `tours` row | → `web_tours` | → `web_tour_departures` |
|---|---|---|
| `SPAINPORT23092026` | slug `spain-and-portugal`, key `SPAINPORT` | 1 row |
| `KERALA14112026` | slug `kerala-munnar-alleppey`, key `KERALA` | 1 row |
| `JAPAN18112027` | slug `japan-in-autumn`, key `JAPAN` | 1 row |
| `TR1` — Bhutan | slug `bhutan`, key `TR1` ⚠️ | 1 row — **needs a real code** |

`TR1` is placeholder data and will not match any CRM stem; flag it during the migration rather than letting it fail silently.

When the real 32 rows load, the 8 duplicated destinations collapse to 8 `web_tours` + 16 `web_tour_departures` — and 8 itineraries stop existing twice.

---

## 4. Reusing `tb_group_tour` — the read model

### 4.1 The derived status ladder

`tour_booking_status` is maintained by hand and goes stale (`Himachal251026` still says `Booking Open` with a July early-bird date). Derive, with the manual value as one input among several:

```sql
CREATE OR REPLACE VIEW v_web_departure_listing AS
SELECT
  d.id AS departure_id, t.id AS web_tour_id,
  t.slug, t.page_title, t.image_path, t.scope,
  d.crm_tour_code, d.start_date, d.end_date,
  COALESCE(g.package_cost, d.fallback_price) AS price_display,
  (g.package_cost IS NULL)                   AS price_is_fallback,
  g.early_bird_discount, g.early_bird_discount_date,
  g.single_supplement_cost, g.tour_advance,
  CASE
    WHEN d.status_override = 1                       THEN d.fallback_status
    WHEN g.tour_status = 'Completed'                 THEN 'departed'
    WHEN d.start_date < CURDATE()                    THEN 'departed'
    WHEN TRIM(g.tour_booking_status) = 'Booking Closed' THEN 'booking_closed'
    WHEN g.tour_code IS NULL                         THEN 'on_request'
    ELSE 'booking_open'
  END AS effective_status
FROM web_tour_departures d
JOIN web_tours t ON t.id = d.web_tour_id
LEFT JOIN tb_group_tour g
       ON TRIM(LOWER(g.tour_code)) = TRIM(LOWER(d.crm_tour_code))
WHERE d.status = 'published' AND d.is_visible = 1 AND t.status = 'published';
```

Three things this gets right that the audit's version did not:

- **`LEFT JOIN`, always.** CRM down ⇒ page still renders from fallbacks.
- **`price_is_fallback` is exposed**, so the front end can print "from ₹62,000" versus "price on request" rather than presenting a stale cache as live truth.
- **`TRIM` on both sides.** `tb_group_tour` row 440 is `' Kinnaur06062026'` with a leading space — your `CrmDepartures` already handles this and the view must too.

### 4.2 Seats: derive scarcity, never expose inventory

`total_rooms_booked` is rooms, not seats, and the ops notes make clear the real capacity is negotiated with a colleague. So **do not build the audit's `seats_available` counter.** There is no trustworthy source, and "2 Seats Left" invented from a room count is a number you would have to defend to a customer. Show `booking_open` / `booking_closed` only, until the CRM records real inventory.

This deliberately declines audit §2.5's `crm_departure_inventory`.

### 4.3 Legacy redirects, free

```sql
INSERT INTO web_redirects (from_path, to_path, status_code)
SELECT
  SUBSTRING(tour_website_link, LOCATE('/grouptour/', tour_website_link)),
  CONCAT('/group-tours/', <mapped slug>),
  301
FROM tb_group_tour WHERE tour_website_link <> '';
```

32 rows, no crawling. Do this **before cutover** — it is the one step whose loss is unrecoverable.

---

## 5. New tables the website genuinely needs

Only what has a concrete source in your existing static content. Everything speculative is listed in §7 as deferred.

### 5.1 Gift holidays *(replaces `gift-holidays.ts`)*

```
web_packages            package_code UNIQUE ('DPKER019'), title, slug, summary,
                        duration_days/nights, base_city, starting_price,
                        meal_plan_label, accommodation_label, status, SEO cols
web_package_variants    package_id, hotel_category, transport_type, pax_basis,
                        price_per_person  — the 2-D matrix, UNIQUE on the triple
```

Two tables, not the audit's five: `hotel_categories` and `transport_types` are 3 and 4 values respectively. Lookup tables for 7 rows total is ceremony — use short varchars, promote later if an editor needs to rename them centrally.

### 5.2 Workshops / Silver Space *(replaces `workshops.ts`)*

```
web_event_strands   slug, name, tagline, body, image_path      — 3 rows
web_events          strand_id, title, slug, format_label, summary, body,
                    delivery_mode, disclaimer, status
web_event_batches   event_id, start_date, end_date NULL, recurrence_label,
                    start_time, weekdays, total_classes, display_status
web_event_tiers     batch_id, label, class_count, price, payment_link
```

`web_event_batches` is what fixes the audit's staleness defect — 2020/2021 events shown as "Upcoming" because visibility was never date-driven.

### 5.3 Leads and consent — the DPDP Act 2023 gap

The audit found **6+ live forms with no persistence**. This is the largest compliance exposure and has no existing table.

```
web_lead_forms   slug, name, fields_schema, notify_emails, crm_pipeline_code
web_leads        uuid, form_id, full_name, email, phone, age, city, message,
                 consent_marketing, consent_channels SET(...), consent_at,
                 utm_source/medium/campaign, gclid, referrer_url, landing_page,
                 ip_address VARBINARY(16), user_agent, status,
                 crm_pushed_at, crm_push_attempts, crm_push_error
web_consents     subject_type, subject_id, purpose, channel,
                 action ENUM('granted','withdrawn'), consent_text,
                 policy_version, ip_address, occurred_at
```

`web_consents` stores **the exact wording shown at the time**. Under DPDP a consent record that cannot reproduce what the person agreed to is not evidence.

**Also add to the existing `feedback` table:**

```sql
ALTER TABLE feedback
  ADD consent_to_publish  TINYINT(1) NOT NULL DEFAULT 0,
  ADD consent_recorded_at DATETIME NULL,
  ADD source              VARCHAR(30) NOT NULL DEFAULT 'direct',
  ADD travelled_on        DATE NULL;
```

You are already publishing 9 testimonials with no recorded permission. The audit found the same quote reused across unrelated tours on the live site.

### 5.4 Redirects and SEO

```
web_redirects  from_path UNIQUE(191), to_path, status_code, hit_count,
               last_hit_at, is_active
web_seo_meta   seoable_type + seoable_id UNIQUE, canonical_url,
               robots_index, robots_follow, twitter_card, schema_type, schema_json
```

`web_seo_meta` is polymorphic because `tours` already carries `meta_*` inline and blog/packages/events each need the same six fields. **Migrate the existing inline `meta_*` columns into it rather than duplicating** — two sources for one `<title>` is the drift the audit documented (§1.3J).

---

## 6. Complete target structure

```
── CRM, READ-ONLY ────────────────────────────────────────
tb_group_tour ........... schedule, price, discounts, status   [SELECT only]
tours (CRM) ............. untouched — feedback_tokens cascades from it
travellers, feedback_tokens, tb_feedback_responses ....... no website access
tb_trf_contact, tb_trf_traveller, tb_trf_tokens .......... NO ACCESS (PII)

── WEBSITE, READ/WRITE ───────────────────────────────────
web_tours ─┬─< web_tour_departures ──► joins tb_group_tour on crm_tour_code
           ├─< tour_itinerary_days      (existing, re-keyed)
           ├─< tour_list_items          (existing, re-keyed)
           ├─< tour_booking_steps       (existing, re-keyed)
           ├─< gallery_items            (existing, via tour_id)
           └─< feedback                 (existing, via tour_id)

web_packages ──< web_package_variants
web_event_strands ──< web_events ──< web_event_batches ──< web_event_tiers
web_lead_forms ──< web_leads ──< web_consents
web_redirects, web_seo_meta, web_tour_categories

blog_posts, hero_banners, site_settings,
why_us_sections, who_we_are_cards ....... existing, unchanged
```

**Every foreign key is `web_*` → `web_*`.** No FK points at a CRM table, so the whole website can be dropped without the CRM noticing.

---

## 7. Deliberately NOT built

Declining these is a recommendation, not an oversight. The audit proposes ~45 tables; this plan proposes 13 new ones.

| Audit table | Why not now |
|---|---|
| `media` + `mediables` | A full asset library replaces `*_path` on 8 working tables. Large, invasive, no user-visible gain today. |
| `destinations` + `attractions` | Real value (destination landing pages) but that is a **new feature**, not a migration. The places strip works as ordered text until then. |
| `crm_departure_inventory` | No trustworthy seat source (§4.2). |
| `crm_members` / `crm_bookings` / `crm_payments` | Member portal is out of scope; mirroring payment data multiplies PII exposure for nothing. |
| `content_revisions`, `activity_log` | Add when more than one editor exists. |
| `hotel_categories`, `transport_types` | 7 rows total; inlined (§5.1). |
| `pages` + `page_sections` | Flexible page builder. Defer until the static TS modules actually need editing. |
| `newsletters`, `faqs`, `stat_counters`, `media_mentions`, `membership_plans` | Straightforward, no urgency. Add per feature. |

---

## 8. Safety — grants and the `migrate:fresh` hazard

If website tables share the CRM database, Laravel's `migrate:fresh` **drops every table in it, including the CRM's**. Your own migration note records this already happening once on this project.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON voyagers.web_%       TO 'web_app'@'%';
GRANT SELECT                         ON voyagers.tb_group_tour TO 'web_app'@'%';
-- Deliberately NOT granted: tb_trf_*, tb_feedback_responses,
-- travellers, feedback_tokens, tours.
```

Plus: block `migrate:fresh`/`migrate:refresh` outside local, back up before every shared-DB migration, and exclude `tour_feedback` from every query (§1.4).

---

## 9. Open questions

| # | Question | Blocks |
|---|---|---|
| 1 | **Approve the §0 split** — `web_tours` + `web_tour_departures`, or keep one flat table? | All of §3 |
| 2 | **Is `tb_group_tour` in the same database** as the website tables will be? If not, the §4.1 view is impossible and the join moves to PHP. | §4.1 |
| 3 | **Approve the `web_` prefix** and renaming `tours` → `web_tours`. | First migration |
| 4 | **Confirm no seats/"2 Seats Left" badge** until real inventory exists (§4.2). | Listing UI |
| 5 | **Who owns CRM schema changes**, and what is the approval path? | Deployment |
| 6 | **Confirm `tour_feedback` and `tb_trf_*` are never exposed** (§1.4). | Sign-off |

Question 1 is the one that gets more expensive every week it stays open.

---

## 10. Sequencing

1. **`web_redirects` + load 32 rows from `tour_website_link`.** Everything else is recoverable; rankings are not.
2. **Rename `tours` → `web_tours`; create `web_tour_departures`; split the 4 rows; re-key 92 child rows.** One transaction, reversible.
3. **Point `CrmDepartures` at `web_tour_departures.crm_tour_code`** instead of the regex stem. Behaviour identical; source explicit.
4. **`web_leads` + `web_consents`,** and wire the 6 live forms. Compliance, and currently every submission is lost.
5. **`feedback` consent columns** (§5.3).
6. **`web_packages` / `web_events`,** retiring two static TS modules.
7. **`web_seo_meta`,** migrating inline `meta_*` into it.
8. Deferred items from §7, per feature.

Steps 1–3 are one working session against 4 rows. The same work after 32 tours are loaded is a data-migration project.

---

*Prepared 14 September 2026. No schema changes made. Awaiting §9 answers — principally Q1.*
