# Component Inventory — 50plusvoyagers

**Generated:** 2026-08-10

## Layout Primitives — `site/components/section.tsx`

The vocabulary every homepage section is built from. Learn these first.

| Export           | Signature / props                                        | Purpose                                                                 |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Section`        | `tone?: 'surface' \| 'alt'`, `top/bottom?: 'lg' \| 'sm' \| 'none'` | Full-bleed band with the fluid vertical rhythm. `tone` picks white vs `#f6f5f1`. |
| `Container`      | standard `div` props                                      | Centred 1180px measure + fluid gutter (`.voy-container`).               |
| `Eyebrow`        | standard `p` props                                        | Uppercase brand-coloured kicker above a heading.                        |
| `SectionHeading` | `size?: 'h2' \| 'h3'`                                    | Serif display heading (`.voy-heading` + fluid size token).              |
| `RuleLink`       | anchor props                                              | Uppercase link with underline rule and an arrow that slides on hover.   |

**Spacing note:** `top`/`bottom` map to `pt-section` (`clamp(56px,8vw,116px)`) and `pt-section-sm`
(`clamp(48px,6vw,80px)`). Adjacent sections often use `bottom="none"` on one and `top="none"` on the
next so bands don't double up — check neighbours before changing.

## Homepage Sections — `site/features/home/`

Rendered in this order by `pages/home.tsx`:

| # | Component      | File                | Section id | Notes                                                                    |
| - | -------------- | ------------------- | ---------- | ------------------------------------------------------------------------ |
| 1 | `Hero`         | `hero.tsx`          | —          | Headline + CTAs + 5-slide carousel with prev/next and counter.           |
| 2 | `WhoWeAre`     | `who-we-are.tsx`    | `#why`     | Four-up value cards.                                                     |
| 3 | `PressStrip`   | `press-strip.tsx`   | —          | "As featured in" wordmarks + 4.8/5 star rating. Alt background.          |
| 4 | `TripCalendar` | `trip-calendar.tsx` | `#trips`   | Month tabs (scroll horizontally on mobile) + 3 trip cards.               |
| 5 | `ImageDivider` | `image-divider.tsx` | —          | Reusable banner. Rendered twice from `dividers.adventure` / `.sorted`.   |
| 6 | `WhyUs`        | `why-us.tsx`        | —          | Checklist + CTA beside a photo with hover caption. Alt background.       |
| 7 | `Toasts`       | `toasts.tsx`        | —          | Three testimonial quotes with avatars. Alt background.                   |
| 8 | `Films`        | `films.tsx`         | `#stories` | Three portrait cards, centre one taller; decorative ring/blob behind.    |
| 9 | `Gallery`      | `gallery.tsx`       | —          | Four photos with hover-reveal story captions.                            |
| 10| `FullyHosted`  | `fully-hosted.tsx`  | —          | Numbered 01–04 explainer columns.                                        |
| 11| `ImageDivider` | (reused)            | —          | Second instance.                                                         |
| 12| `Contact`      | `contact.tsx`       | —          | Call/email/WhatsApp cards + newsletter form. Alt background.             |
| 13| `Journal`      | `journal.tsx`       | `#journal` | Three article cards.                                                     |

`ImageDivider` is the only parameterised section:

```tsx
<ImageDivider {...dividers.adventure} />
// { src, alt, title, body, cta: { label, href } }
```

## Layout — `site/layout/`

| Component    | Notes                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `SiteLayout` | Flex column shell (`min-h-dvh`) with sticky footer. **Starts the motion layer** via `useSiteMotion(pathname)`. |
| `SiteHeader` | Sticky. Top utility bar (phone + login) above a 3-column grid nav at `lg`+; hamburger drawer below. Nav content comes from `siteConfig.navLeft` / `navRight`. |
| `SiteFooter` | Wordmark, three social icons, four link columns from `siteConfig.footerNav`, copyright.            |

## UI Primitives — `shared/ui/`

### `Button` (`button.tsx`)

shadcn button extended with brand variants. Use `asChild` to render as an `<a>`.

**Variants:** `default` · `destructive` · `outline` · `secondary` · `ghost` · `link` ·
**`brand`** (brand fill, deep hover, 500ms brand easing) · **`outline_circle`** (circular outline, brand hover)

**Sizes:** `default` · `sm` · `lg` · `icon` · **`pill`** (rounded-full, 15px/28px, bold, tracked) · **`circle`** (42px)

```tsx
<Button asChild variant="brand" size="pill">
    <a href="#trips">Browse the trip calendar <ArrowRight className="size-4" /></a>
</Button>
```

### `Card` (`card.tsx`)

Stock shadcn card (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
**Not currently used by the homepage** — the design's cards are bespoke. Retained for future UI.

## Icons — `shared/ui/brand-icons.tsx`

`lucide-react` v1 **removed brand icons**, so these are hand-drawn to match the reference paths:

- `InstagramIcon` · `FacebookIcon` · `WhatsAppIcon`

`WhatsAppIcon` is also used in the Contact section (lucide's `MessageCircle` is a plain circle; the
reference uses a chat bubble with a tail).

Everything else comes from `lucide-react`: `ArrowRight`, `ChevronLeft/Right`, `Play`, `Check`,
`Star`, `Phone`, `Mail`, `Menu`, `X`, `User`.

## Hooks

### `useHeroSlider(count)` — `site/features/home/use-hero-slider.ts`

Returns `{ index, goTo, step }`.

- Autoplays every **6500 ms**, matching the reference.
- Pauses while the tab is hidden (`document.visibilityState`).
- A manual `step()` restarts the countdown.
- Skipped entirely under `prefers-reduced-motion` (and re-syncs if the preference changes).

### `useSiteMotion(key)` — `site/motion/use-site-motion.ts`

Runs the choreography for the current route. Uses `useLayoutEffect` so hidden states land before
paint. Wrapped in try/catch — on any failure it releases the boot cloak and hands the page over
un-animated. Pass `pathname` so the motion rebuilds when a new page's sections mount.

See [motion-layer.md](./motion-layer.md).

## Adding a New Homepage Section

1. **Content** → add a typed export to `frontend/src/site/data/home.ts`.
2. **Component** → create `site/features/home/<name>.tsx` using `Section` / `Container` / `Eyebrow` /
   `SectionHeading`. Keep it a pure renderer.
3. **Compose** → import and place it in `pages/home.tsx`.
4. **Vertical rhythm** → check the `top`/`bottom` props against the neighbouring sections.
5. **⚠️ Animation opt-in** → the motion layer will fade-and-rise each direct child of your
   `Container` automatically. If a child is a *grid or row of cards*, add `data-voy-group` to it so
   its children stagger individually instead of the whole block moving as one. Without this the
   section still animates, just less gracefully.
6. **Nav** → if it needs a nav entry, add it to `siteConfig` and give the section an `id`.

## Conventions Recap

- Compose with the primitives; don't re-derive container widths or section padding.
- Merge classes with `cn()`.
- Reference internal URLs through `paths`.
- Images go in `public/images/home/` and are referenced via the `img()` helper in `site/data/home.ts`.
- Keep content out of components.
