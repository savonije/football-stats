---
name: tailwind-conventions
description: >-
    Use whenever writing or editing Tailwind utility classes in this repo's .vue or
    .css files. This is a Tailwind v4 project (no tailwind.config.js) — the theme is
    defined in an `@theme` block in src/styles/main.css. Enforces using the project's
    EXISTING theme tokens (the primary color scale, custom shadows, tracking, etc.)
    and the standard utility scale instead of inventing arbitrary values or hardcoding
    hex. Don't assume or make up tokens: look them up in src/styles/main.css or add
    them to the `@theme` block.
---

# Tailwind conventions for this project

**Golden rule: use the theme tokens and the utility scale. Don't invent, assume, or
hardcode values.** The point of the scale and the `@theme` tokens is consistency —
reach for them first, every time.

## Setup facts (don't re-derive)

- **Tailwind v4**, integrated via the `@tailwindcss/vite` plugin (see `vite.config.ts`).
- **There is no `tailwind.config.js`.** Tailwind is imported and configured in CSS:
  `@import 'tailwindcss'` in `src/styles/main.css`, and the theme lives in an
  **`@theme { … }`** block in that same file.
- **No class prefix.** Use plain utilities (`flex`, `text-sm`, `bg-white`).
- `@` is aliased to `src/`. CSS partials are imported with `@import '@/styles/…'`.
- **prettier-plugin-tailwindcss** sorts class lists automatically. Don't hand-order
  classes; run `npm run format` after editing and let it sort.
- Templates are indented with **4 spaces**. Vue 3 `<script setup lang="ts">` + Composition API.

## 1. Use scale utilities, not arbitrary px

Prefer the scale step over an arbitrary bracket value:

```html
<!-- ✅ use the scale -->
class="size-9 px-5 py-2.5 gap-1 text-sm rounded-xl mb-4"

<!-- ❌ don't invent magic numbers -->
class="h-[36px] w-[36px] px-[20px] text-[14px] rounded-[12px]"
```

This applies to spacing (`p/m/gap/space`), sizing (`w/h/size/min/max`), `text-*`,
`rounded-*`, `leading-*`, insets, etc. Arbitrary `[Npx]` values are a genuine last
resort — the codebase uses only a handful (`w-[400px]`, `border-[3px]`,
`transition-[width]`) and only where no scale step fits.

**Font size is never a last resort — always use a preset size.** Never write an
arbitrary font size like `text-[0.7rem]` or `text-[14px]`. Use only the named text
sizes: the standard scale (`text-xs`, `text-sm`, `text-base`, `text-lg`, …) plus the
project token `text-xxs` (0.65rem) for anything smaller than `text-xs`. If you need a
size that none of these provide, add a `--text-*` token to the `@theme` block (see
§3) rather than inlining a bracket value.

## 2. Use the project's theme tokens, not raw hex / one-off values

Custom tokens are defined in the `@theme` block of `src/styles/main.css`. Always
use the named utility they generate:

```html
<!-- ✅ -->
class="bg-primary-50 text-primary-400 shadow-card hover:shadow-card-hover
font-display tracking-label text-xxs max-w-8xl duration-900"
<!-- ❌ -->
class="bg-[#f2f5fb] text-[#6285d1] shadow-[0_2px_12px_rgba(39,66,138,.08)]"
```

Currently defined custom tokens (confirm against `src/styles/main.css` before use):

- **Brand color scale:** `primary-50 … primary-950`, plus bare `primary` (#27428a).
  Generates `bg-/text-/border-primary-*`, etc. This same scale is fed to the PrimeVue
  Aura preset in `main.ts`, so app chrome and utilities stay in sync.
- **Font:** `font-display` (Roboto).
- **Shadows:** `shadow-hero`, `shadow-card`, `shadow-icon`.
- **Type/spacing extras:** `text-xxs` (0.65rem), `tracking-label` (0.06em),
  `tracking-badge` (0.08em), `max-w-8xl` (90rem), `duration-900` (900ms).

The full default Tailwind palette (`gray-300`, `white`, etc.) is also available for
neutrals.

## 3. Need a value that isn't in the system? Add it to `@theme` — don't inline it

If you genuinely need a new token (a recurring color, shadow, spacing, duration),
**add it to the `@theme` block in `src/styles/main.css`** using the v4 naming
convention (`--color-*`, `--shadow-*`, `--text-*`, `--tracking-*`, `--max-width-*`,
`--duration-*`), so it becomes a reusable utility. Don't scatter one-off arbitrary
values the next person has to guess at.

## 4. Dark mode

**Dark mode is not enabled** (`darkModeSelector: false` in `main.ts`), and no
component uses any `dark:` variant. **Don't add `dark:` classes** — they have no
effect today. Enabling dark mode would require flipping the PrimeVue
`darkModeSelector` and adopting a dark color strategy first; revisit only then.

## 5. Component styles vs. global styles vs. PrimeVue overrides

- **Component-local styling:** utility classes in the template. **Never use `<style>`
  blocks, CSS modules, or CSS-in-JS** (per `CLAUDE.md`).
- **Element base styles / helpers** (e.g. `h1`–`h6`, `.container`, `body`) live in the
  CSS partials (`src/styles/base.css`, `typography.css`, `main.css`) and use **`@apply`**
  with the same theme tokens.
- **PrimeVue component theming:** the Aura preset's primary palette is set in `main.ts`
  via `definePreset`, reading the CSS vars through the `theme()` helper in
  `@/utils/tailwind`. Visual tweaks to PrimeVue parts (`.p-card`, `.p-drawer`,
  `.p-datatable`, `.p-dialog`, `.p-toast`) are global rules in `main.css` and require
  `!important` to win over Aura's own styles. Teleported components (drawer, dialog,
  toast) **must** be styled globally, not scoped.

## Workflow before writing/editing classes

1. Open `src/styles/main.css` (`@theme` block) → is there already a token / scale step
   for this?
2. Grep a sibling in `src/components/` for how the same property is expressed (e.g.
   `PlayerStatTile.vue` for the card/tile pattern) — match the established style.
3. Reach for the scale utility or theme token. Only fall back to `[arbitrary]` when
   nothing fits, and prefer adding a token to `@theme` for anything recurring.
4. Use Tailwind responsive breakpoints (`sm/md/lg/xl`) for layout, per `CLAUDE.md`.
5. Run `npm run format` (sorts classes) and `npm run type-check` after edits.
