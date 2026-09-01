# Motion Layer — 50plusvoyagers

**Generated:** 2026-08-10
**Primary source:** `frontend/src/site/motion/motion.ts` (+ `site/motion/use-site-motion.ts`, styles in `frontend/src/styles/app.css`)

> **Read this before touching any animation or adding a homepage section.** The motion system
> discovers elements by DOM convention. New markup that doesn't follow the convention will not
> animate, and markup that unknowingly matches it will animate unexpectedly.

## Verification Status

✅ **Verified 2026-08-10.**

| Check                | Status                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| `npm run types`      | ✅ Passing                                                             |
| `npm run lint`       | ✅ Passing — 8 errors were found and fixed on first run (see below)    |
| `npm run build`      | ✅ Passing                                                             |
| Browser verification | ✅ Boot cloak released, Lenis active, 21 cards tagged, sections reveal on scroll, no console errors |

The first lint run (during the admin-panel work) surfaced 8 real errors in this module that had never
been checked: an unbound `ScrollTrigger.update` reference, a Promise used in a boolean conditional,
unsafe `any` from `gsap.quickSetter`, and four cases of GSAP timelines being thenable — so
`() => tl.kill()` counted as returning a Promise where `void` was expected. All fixed.

## Why It Exists

The homepage was rebuilt from a supplied standalone HTML reference. That reference's animations were
**not in its stylesheet** — they lived in a separate bundled script implementing a full GSAP motion
layer. The first implementation pass ported only the CSS and therefore shipped without any scroll
choreography. This module is the port of that missing layer.

## Dependencies

| Package      | Version   | Role                                                | Licence  |
| ------------ | --------- | --------------------------------------------------- | -------- |
| `gsap`       | ^3.15.0   | Timelines + `ScrollTrigger`                         | Standard "no charge" |
| `lenis`      | ^1.3.26   | Smooth wheel scrolling and smooth in-page anchors   | MIT      |
| `split-type` | ^0.3.4    | Splits the hero `h1` into lines for stagger         | ISC      |

The reference used GSAP 3.13 / SplitType 0.3.4 / Lenis — the same set.

## Design Rules (inherited from the reference)

The module is **presentation-only**. It never changes layout, spacing, typography, colour, or
responsive behaviour. It touches only `opacity`, `transform`, and `object-position`.

**Motion budget:**
- Movement ≤ 30 px · duration 0.6–0.9 s
- Easing `power2.out` / `power3.out`
- No bounce, elastic, rotation, or scaling beyond 1.03

**Exact-restore contract:** every animated element's original `style` attribute is stashed in a
`WeakMap` before it is touched, and restored verbatim when its reveal completes. This is why the
code uses `gsap.set` + manual restore rather than `clearProps` — the design leans on author styles
(e.g. `opacity-55` on the press logos) and they must come back untouched.

**Zero CLS:** hidden states are applied with `gsap.set`, never `.from`, so nothing is visible for a
frame before its own reveal.

## What It Does

### 1. Boot cloak + page fade-in
`app.blade.php` adds `voy-boot` to `<html>` (from JS, with a 2.5 s failsafe removal). CSS holds
`body { opacity: 0 }`. The motion layer fades the body in over 0.7 s and removes the class.
`unboot()` runs on **every** code path — reduced motion, no sections, error — so the page can never
be stranded invisible.

### 2. Hero intro timeline
Runs once on load, after `document.fonts.ready` (or a 1.2 s cap) so line measurement is accurate:

| Element        | Hidden state         | Reveal                                     | At     |
| -------------- | -------------------- | ------------------------------------------ | ------ |
| body           | `opacity: 0`         | → 1, 0.7 s                                 | 0      |
| eyebrow `p`    | `opacity:0, y:16`    | → 0, 0.7 s                                 | 0.12 s |
| `h1` lines     | `opacity:0, yPercent:28` | → 0, 0.9 s, stagger 0.1, `power3.out`  | 0.24 s |
| subtitle `p`   | `opacity:0, y:20`    | → 0, 0.8 s                                 | 0.55 s |
| CTA anchors    | `opacity:0, y:14`    | → 0, 0.7 s, stagger 0.09                   | 0.72 s |

The `h1` is split by SplitType and **reverted immediately after**, restoring the original markup and
its `text-wrap: balance`. If SplitType fails, it falls back to a whole-heading `y: 22` rise.

The hero **carousel images are deliberately excluded** — they own their own CSS scale transition, and
a GSAP tween would fight it. The slider container is marked `data-voy-hero-slides` for this reason.

### 3. Scroll reveals
Every `<section>` after the first gets a paused timeline played by `ScrollTrigger`
(`start: 'top 86%'`, `once: true`), backstopped by an `IntersectionObserver`
(`rootMargin: '0px 0px -14% 0px'`). The observer exists because a fast scroll can retire a trigger
before its timeline plays, stranding a block at `opacity: 0`.

Within a section, each direct child of the inner `Container` is classified:

| Child                       | Treatment                                                        | Advances `at` by |
| --------------------------- | ---------------------------------------------------------------- | ---------------- |
| `.voy-divider`              | Image fades 0.9 s, then body parts rise, stagger 0.1, at `+0.22` | 0.10 s           |
| `[data-voy-group]`          | Children individually fade+rise 20 px, stagger 0.1                | 0.20 s           |
| anything else               | Whole block fades+rises 20 px, 0.8 s                              | 0.12 s           |

One vocabulary everywhere: fade + 20 px rise. Headings lead, body copy follows, buttons land last —
purely from source order plus the cadence, so no section needs a bespoke rule.

The footer gets the same treatment across its direct children, stagger 0.1.

### 4. Card hover zoom
`buildGroup` tags each card that contains an image:
`data-voy-card` on the card, `data-voy-img` on its image. The paired CSS lifts the **image** 3 px and
scales it to 1.03 over 0.6 s — the card itself never moves and gains no shadow.

Because these attributes are applied at runtime, **cards only gain hover zoom once the motion layer
has run.** Under reduced motion they never get it (which is correct).

### 5. Parallax
Desktop only (`min-width: 900px`), on `.voy-divider img` only. Scrubs `object-position` from
`50% 45%` to `50% 55%` across the scroll range. It uses `object-position` rather than `transform`
specifically so it cannot collide with the hover scale on the same images, and it crops nothing new —
at the section midpoint the framing is exactly the original `50% 50%`.

### 6. Smooth scrolling
Lenis with `duration: 1.15`, custom exponential easing, `touchMultiplier: 1.6`. A delegated click
handler intercepts `a[href^="#"]` and calls `lenis.scrollTo(target, { offset: 0, duration: 1.4 })`,
so anchors keep their existing landing position and only the travel becomes smooth.

Required Lenis CSS lives in `app.css` (`html.lenis`, `.lenis-smooth`, `.lenis-stopped`). Note
`.lenis.lenis-smooth { scroll-behavior: auto !important }` — this is what stops the base
`scroll-behavior: smooth` from fighting Lenis.

## The DOM Contract

This is the part most likely to bite you.

| Marker                   | Where it goes                                  | Effect                                                        |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------- |
| `data-voy-group`         | A grid/row container of cards                  | Its **children** stagger individually rather than the block moving as one |
| `.voy-divider`           | The banner wrapper (already in `ImageDivider`) | Image-then-copy divider choreography + parallax               |
| `data-voy-hero-slides`   | The hero slide wrapper                         | Tells the intro to leave those images alone                   |
| `data-voy-card` / `-img` | **Applied at runtime** — never author these    | Hover zoom pairing                                            |

Sections currently carrying `data-voy-group`: who-we-are (values), press-strip (logos `ul`),
trip-calendar (month row **and** trip grid), why-us (2-col grid), toasts, films (`.voy-films`),
gallery, fully-hosted (`ol`), contact (channels), journal.

### Why `data-voy-group` is explicit here

The reference detected these containers by sniffing **inline styles** for `grid-template-columns` /
`display:flex;flex-wrap:wrap`. This codebase styles with Tailwind classes, so that sniffing cannot
work. Marking them explicitly is the equivalent, and is self-documenting.

### A subtle case worth preserving

The press-logo `ul` carries `opacity-55`. It is marked as a **group**, so GSAP animates the `<li>`
children and never touches the `ul`'s own opacity. Had the `ul` itself been animated, it would fade
to `opacity: 1` and then snap back to `0.55` on restore — a visible pop. Keep group markers on the
*container* whose children should move, not on the element carrying design opacity.

## Lifecycle & Teardown

`startMotion()` returns a teardown that: removes listeners, removes the GSAP ticker callback,
destroys Lenis, disconnects the observer, kills every timeline and ScrollTrigger, restores any
element still awaiting a reveal, and clears the body opacity.

`useSiteMotion(pathname)` re-runs it on route change so a new page's sections are picked up.

## Reduced Motion

`startMotion()` returns immediately (after unbooting) when `prefers-reduced-motion: reduce` matches.
No GSAP, no Lenis, no parallax, no hover zoom. The CSS reduced-motion block separately disables the
`.voy-*` transitions and the card hover transform. The hero carousel also stops autoplaying.

## Debugging Checklist

| Symptom                              | Likely cause                                                              |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Page stays blank                     | Boot cloak not released — check the 2.5 s failsafe in `app.blade.php` and `unboot()` calls |
| A section never appears              | Its timeline never played; check the section is a real `<section>` inside `main` |
| Whole grid moves as one block        | Missing `data-voy-group` on the grid container                            |
| An element pops brightness on reveal | It carries a design `opacity-*` class and is being animated directly — mark its parent as the group instead |
| Anchors jump instead of gliding      | Lenis not initialised (reduced motion, or motion layer threw)             |
| Nothing animates at all              | `prefers-reduced-motion` is on, or `useSiteMotion` caught an error — check the console for `[voy-motion]` |

## Files

| File                                  | Role                                          |
| ------------------------------------- | --------------------------------------------- |
| `frontend/src/site/motion/motion.ts`          | The engine — framework-agnostic               |
| `frontend/src/site/motion/use-site-motion.ts` | React wrapper (`useLayoutEffect` + guard)   |
| `frontend/src/site/layout/site-layout.tsx` | Calls the hook                     |
| `frontend/src/styles/app.css`               | Card-hover CSS, Lenis CSS, boot cloak, reduced-motion overrides |
| `resources/views/app.blade.php`       | Boot-cloak script + failsafe                  |
