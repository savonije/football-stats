---
name: tailwind
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
  classes; run `npm run prettier` after editing and let it sort.
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
resort — the codebase uses only a handful (`border-[3px]`, `transition-[width]`)
and only where no scale step fits.

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
class="bg-primary-50 text-primary-400 shadow-card font-display
tracking-label text-xxs max-w-8xl duration-900"
<!-- ❌ -->
class="bg-[#f2f5fb] text-[#6285d1] shadow-[0_2px_12px_rgba(39,66,138,.08)]"
```

Currently defined custom tokens (confirm against `src/styles/main.css` before use):

- **Brand color scale:** `primary-50 … primary-950`, plus bare `primary` (#27428a).
  Generates `bg-/text-/border-primary-*`, etc. Nuxt UI's semantic `primary` is
  mapped onto this same scale in `vite.config.ts`, so component chrome and
  utilities stay in sync.
- **Accent color:** bare `amber` (#f59e0b) → `text-amber`, `bg-amber`. Note this is a
  *single* color, separate from Tailwind's built-in `amber-50…950` scale — `text-amber`
  and `text-amber-500` are different values.
- **Font:** `font-display` (Roboto).
- **Shadows:** `shadow-hero`, `shadow-card`, `shadow-icon`.
- **Type/spacing extras:** `text-xxs` (0.65rem), `tracking-label` (0.06em),
  `tracking-badge` (0.08em), `max-w-8xl` (90rem), `duration-900` (900ms).
- **Animation:** `animate-score-pop` — the scale-and-flash-amber pulse used when a
  goal lands (see `LiveMatchWidget.vue`).

### Gradients are variables, not utilities

`--gradient-brand` (the dark-blue banner used by the page header and player hero) and
the six accent gradients — `--gradient-accent-blue` / `-amber` / `-teal` / `-purple` /
`-green` / `-red` (stat tiles and nav icons) — are defined in `@theme`, but
`--gradient-*` is **not** a Tailwind v4 theme namespace, so **no `bg-gradient-brand`
utility exists**. Reference them as CSS variables instead, matching how the codebase
already does it:

```html
<!-- ✅ inline style (NavDrawer.vue, PlayerStatTile props) -->
style="background: var(--gradient-accent-blue)"
<!-- ✅ arbitrary property utility (players/[id].vue) -->
class="[background:var(--gradient-brand)]"
<!-- ❌ never re-spell the gradient by hand -->
class="bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)]"
```

Adding a *new* recurring gradient means adding a `--gradient-*` token to `@theme` and
referencing it the same way — not inlining a `linear-gradient(...)` at the call site.

The full default Tailwind palette (`gray-300`, `white`, etc.) is also available for
neutrals.

## 3. Need a value that isn't in the system? Add it to `@theme` — don't inline it

If you genuinely need a new token (a recurring color, shadow, spacing, duration),
**add it to the `@theme` block in `src/styles/main.css`** using the v4 naming
convention (`--color-*`, `--shadow-*`, `--text-*`, `--tracking-*`, `--max-width-*`,
`--duration-*`, `--animate-*`), so it becomes a reusable utility. Don't scatter one-off
arbitrary values the next person has to guess at. (`--gradient-*` is the exception —
it's a plain variable with no generated utility; see §2.)

## 4. Dark mode

**Dark mode is not enabled** (`colorMode: false` in `vite.config.ts`) and no
component uses any `dark:` variant. **Don't add `dark:` classes** — they have no
effect today. That flag is load-bearing: with Nuxt UI's color mode on, it calls
VueUse's `useDark()`, which follows the OS preference and puts `.dark` on `<html>`,
turning every component dark while `main.css` keeps the page light. Enabling dark
mode means flipping that flag *and* adopting a dark color strategy for the app's own
tokens; revisit only then.

## 5. Dialog widths: one way only

Every `<UModal>` gets its width from a **Tailwind container width class on the
modal's `content` slot**, taken from the `w-3xs … w-7xl` scale. `w-md` is the default
across the app; step up (`w-lg`, `w-2xl`, …) only when the content genuinely needs it.

```html
<!-- ✅ the only accepted form -->
<UModal v-model:open="model" :title="t('…')" :ui="{ content: 'w-md' }" />

<!-- ❌ never -->
<UModal style="width: 450px" />
<UModal :style="{ width: '400px' }" />
<UModal :ui="{ content: 'w-96' }" />
<UModal :ui="{ content: 'w-[400px]' }" />
```

Don't add responsive variants for the small-screen case — `vite.config.ts` already
caps every modal at `max-w-[calc(100vw-2rem)]`. That cap lives in
`ui.modal.variants.fullscreen.false.content`, not in `slots.content`: the Nuxt UI
theme puts its own `max-w-lg` on that same variant, and tailwind-merge keeps the
later class, so a cap set on the base slot is silently dropped.

## 6. Component styles vs. global styles vs. Nuxt UI overrides

- **Component-local styling:** utility classes in the template. **Never use `<style>`
  blocks, CSS modules, or CSS-in-JS** (per `CLAUDE.md`).
- **Element base styles / helpers** (e.g. `h1`–`h6`, `.container`, `body`) live in the
  CSS partials (`src/styles/base.css`, `typography.css`, `main.css`) and use **`@apply`**
  with the same theme tokens.
- **Nuxt UI component theming:** semantic colours are mapped in `vite.config.ts`
  (`ui.colors`), which points `primary` at the `--color-primary-*` scale above.
  Restyle a component through its own **`ui` prop** (per instance) or `ui.<component>`
  in `vite.config.ts` (app-wide) — both take Tailwind classes per slot. Because these
  compose with the component's own theme, **nothing needs `!important`**, and
  teleported components (slideover, modal, toast) no longer need global CSS at all.
  A slot override reused across several instances belongs in a shared constant next to
  its component, like `TABLE_UI` in `src/utils/table.ts`.

## Workflow before writing/editing classes

1. Open `src/styles/main.css` (`@theme` block) → is there already a token / scale step
   for this?
2. Grep a sibling in `src/components/` for how the same property is expressed (e.g.
   `PlayerStatTile.vue` for the card/tile pattern) — match the established style.
3. Reach for the scale utility or theme token. Only fall back to `[arbitrary]` when
   nothing fits, and prefer adding a token to `@theme` for anything recurring.
4. Use Tailwind responsive breakpoints (`sm/md/lg/xl`) for layout, per `CLAUDE.md`.
5. Run `npm run prettier` (sorts classes) and `npm run type-check` after edits.
