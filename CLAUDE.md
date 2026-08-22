# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with hot-reload
npm run build        # type-check + build for production
npm run lint         # eslint then oxlint (run-s lint:*, both with --fix)
npm run type-check   # vue-tsc --build type checking
npm run prettier     # prettier --write src/ (prettier:check to verify only)
npm run test         # Playwright end-to-end tests
npm run knip         # find unused files, exports and dependencies
```

Playwright tests live in `e2e/` and run against a production preview build (`playwright.config.ts` boots `npm run preview` on port 4173 as its `webServer`). Run a single spec/test:

```bash
npx playwright test e2e/home.spec.ts            # one file
npx playwright test -g "shows top scorers"      # by test title
```

The e2e tests hit **real Firestore data** through the preview build (no emulator, no fixtures), so assertions are written defensively — e.g. `card.or(emptyMatches)` rather than expecting specific matches to exist. Keep new specs data-agnostic and unauthenticated (they never log in).

Knip (`knip.json`) runs on its auto-detected defaults — it picks up the Vite, Playwright, ESLint and Prettier configs on its own, and follows `src/styles/main.css` for CSS-only dependencies like `tailwindcss` and `primeicons`. Only `public/**` is ignored, because those assets are referenced by absolute URL from `index.html` and can't be resolved statically. Don't narrow `project` to `.ts`/`.vue` — that drops the CSS graph and produces false "unused dependency" hits.

Config comes from `VITE_*` env vars (see `.env.example`): Firebase credentials plus `VITE_CLUBNAME`. There is no hardcoded config in source.

CI (`.github/workflows/`) runs `prettier:check`, `type-check`, `knip`, and the Playwright suite on every push/PR to `main` — run `npm run prettier` and `npm run type-check` before handing work off, or CI will fail on formatting alone. The `knip` job is currently expected to fail: it reports pre-existing dead code (see `npm run knip`) and exits non-zero on any finding.

Releases go through the `deploy` skill (`.claude/skills/deploy/SKILL.md`): bump semver → tag → GitHub release → `npm run build` → `firebase deploy`. Don't run a bare `firebase deploy` for a production release.

## Architecture

Vue 3 SPA (Composition API + `<script setup>`) for tracking football match stats for a youth team (Apollo '69 JO9). TypeScript throughout with `@` aliased to `src/`.

### Firestore data model

```
seasons/{seasonId}                         # { active, teamname?, trainingDays?: number[], halfDurationMinutes? }
players/{playerId}                         # { ..., seasons: { [seasonId]: { active, guestPlayer } } }
seasons/{seasonId}/matches/{matchId}
seasons/{seasonId}/matches/{matchId}/appearances/{appearanceId}
seasons/{seasonId}/trainings/{trainingId}  # { date, presentPlayerIds: string[], cancelled? }
```

Season-level settings (team name, half duration, training days) live on the season doc, so per-season behaviour is configurable rather than hardcoded — read them via `seasonStore` getters (`currentTeamName`, `currentHalfDuration`), which fall back to `src/constants`. Document shapes are typed in `src/types/index.ts` (`Season` lives in `seasonStore.ts`).

Seasons are dynamic Firestore documents, not a constant. `seasonStore` fetches the season list and tracks `currentSeason`, persisted to `localStorage` (`selectedSeason`) and reconciled on startup against the `active` season doc (falling back to the newest by id). Match/appearance queries are scoped by passing `seasonStore.currentSeason` into store actions — components read it and `watch(() => seasonStore.currentSeason)` to refetch when the user switches seasons.

Players are a single top-level collection but carry a per-season `seasons` map (roster membership, guest/active status per season). Use the helpers in `src/utils/playerSeason.ts` (`isActiveInSeason`, `isGuestInSeason`) and `playerStore.playersInSeason(seasonId)` rather than reading the map directly.

### Two Firebase access patterns

- **Stores** (`src/stores/`) use `onSnapshot` for real-time reactive data. Stores hold `matches`, `appearances`, and `players` arrays with a `*Loaded` boolean flag.
- **Services** (`src/services/`) use one-shot `getDocs`/`addDoc` for write operations or non-reactive reads (e.g. fetching appearances per player for the player detail view).

### State management (Pinia)

Five stores: `authStore`, `matchStore`, `playerStore`, `seasonStore`, `trainingStore`. All use the **options** form of `defineStore` (`state`/`getters`/`actions` object), not setup stores — match that shape when adding one. `onSnapshot` unsubscribe handles are kept in module-level `let _unsubscribe*` variables and called before re-subscribing, so refetching on a season switch doesn't leak listeners.

Naming gotcha: `authStore.ts` exports `useStoreAuth` (store id `storeAuth`), not `useAuthStore` like the other four.

The router is injected into every store via a Pinia plugin in `main.ts`, so stores can navigate with `this.router.push(...)`.

`matchStore` also drives the live match timer, which mutates the match doc directly so every viewer stays in sync: `startMatch` → `endFirstHalf` → `startSecondHalf` → `endMatch`, plus `pauseMatch`/`resumeMatch`. The doc stores raw timestamps (`startTime`, `pausedAt`, `pausedDuration`, `half`, `halfTime`) — never a running counter — and all clock math is done by the pure helpers in `src/utils/match.ts` (`getElapsedMs`, `getDisplaySeconds`, `isInOvertime`, `formatMatchTime`), which take `halfDurationMinutes` and `now` as arguments. Put new timer logic there, not in components.

`trainingStore` follows the same reactive-store shape (`trainings`/`selectedTraining` with `*Loaded` flags), scoped by `seasonId`; training presence is a `presentPlayerIds` array on each training doc, updated with `arrayUnion`/`arrayRemove`.

`authStore.init()` is called once in `App.vue` `onMounted` to subscribe to Firebase auth state — unauthenticated users are not redirected from most routes, but write operations require auth. Use the `useCanEdit()` composable (`src/composables/`) to gate edit UI — it is true only when a user is authenticated *and* the currently selected season is active.

### Routing & UI layer

Routes are defined manually in `src/router/index.ts` (not file-system auto-routing) but point at page components under `src/pages/` that follow a file-based naming convention: `pages/<domain>/index.vue` for list/index routes and `pages/<domain>/[id].vue` for detail routes. Route `meta` is typed (`title`, `layout`, `heading`, `breadcrumb`) and drives the page header and breadcrumbs.

Each page keeps its own private sub-components in a co-located `_components/` folder (e.g. `pages/matches/_components/MatchTimer.vue`). Truly shared components live under `src/components/` (`ui/`, `layout/`, `dialogs/`). Domains: home, matches, players, topscorers, training, washing (wasschema), login.

PrimeVue (Aura preset) handles UI components. The primary color palette is sourced from Tailwind CSS custom properties and unified in `main.ts` via `definePreset`. Global PrimeVue services (`Toast`, `ConfirmDialog`, `ConfirmationService`) are registered in `main.ts` and rendered in `App.vue`.

### i18n

All UI strings are in Dutch (`nl`), split by domain under `src/lang/nl/`. The `$t()` helper is globally injected (`globalInjection: true`, non-legacy) — use it in every component for any user-facing text; `useI18n()` in `<script setup>` when you need `t` in TS. Pluralized keys use vue-i18n pipe syntax (`game: 'Wedstrijd | Wedstrijden'`) and are called with a count — which is what the `count` field in route `meta.heading`/`meta.breadcrumb` feeds.

## Styling

Tailwind v4 via `@tailwindcss/vite` — **there is no `tailwind.config.js`**; the theme is an `@theme { … }` block in `src/styles/main.css`. A `tailwind` skill (`.claude/skills/tailwind/SKILL.md`) documents the available tokens and conventions; consult it before writing classes.

- **Always use Tailwind CSS.** Never use `<style>` blocks, CSS modules, or CSS-in-JS.
- Use the existing `@theme` tokens (`primary-*` scale, `shadow-card`, `text-xxs`, `tracking-label`, …) and scale utilities instead of arbitrary `[Npx]` or hex values. Add a new token to `@theme` if nothing fits.
- **Dialog width is set exactly one way:** a Tailwind container width class on the `<Dialog>` itself — `class="w-md"` (the `w-3xs … w-7xl` scale). Never `style="width: 450px"`, `:style="{ width: … }"`, `w-96`, or `w-[400px]`. `.p-dialog { max-w-[95%] }` in `main.css` handles small screens, so no responsive variant is needed.
- Dark mode is not enabled (PrimeVue `darkModeSelector: false`), so don't add `dark:` variants — they have no effect. Revisit only if dark mode is turned on.
- Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) for responsive layout.
- PrimeVue part overrides (`.p-drawer`, `.p-datatable`, `.p-dialog`, `.p-toast`) are global rules in `src/styles/main.css` and need `!important` to beat Aura. Teleported components can't be styled locally at all.

## Formatting

Prettier is not optional here — CI fails on it, and the config carries real conventions: 4-space indent, single quotes, 80 print width, and `vueIndentScriptAndStyle: true` (so `<script setup>` bodies are indented one level). Three plugins rewrite code on save: import sorting (third-party → `@/*.vue` → `@/*` → relative), Vue attribute ordering, and Tailwind class sorting. Don't hand-order imports, attributes, or classes — write them and run `npm run prettier`.
