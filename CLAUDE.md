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
```

Playwright tests live in `e2e/` and run against a production preview build (`playwright.config.ts` boots `npm run preview` on port 4173 as its `webServer`). Run a single spec/test:

```bash
npx playwright test e2e/home.spec.ts            # one file
npx playwright test -g "shows top scorers"      # by test title
```

Config comes from `VITE_*` env vars (see `.env.example`): Firebase credentials plus `VITE_CLUBNAME`. There is no hardcoded config in source.

Deploy after building: `firebase deploy`

## Architecture

Vue 3 SPA (Composition API + `<script setup>`) for tracking football match stats for a youth team (Apollo '69 JO9). TypeScript throughout with `@` aliased to `src/`.

### Firestore data model

```
seasons/{seasonId}                         # { active: bool, teamname?: string }
players/{playerId}                         # { ..., seasons: { [seasonId]: {...} } }
seasons/{seasonId}/matches/{matchId}
seasons/{seasonId}/matches/{matchId}/appearances/{appearanceId}
seasons/{seasonId}/trainings/{trainingId}  # { date, presentPlayerIds: string[], ... }
```

Seasons are dynamic Firestore documents, not a constant. `seasonStore` fetches the season list and tracks `currentSeason`, persisted to `localStorage` (`selectedSeason`) and reconciled on startup against the `active` season doc (falling back to the newest by id). Match/appearance queries are scoped by passing `seasonStore.currentSeason` into store actions — components read it and `watch(() => seasonStore.currentSeason)` to refetch when the user switches seasons.

Players are a single top-level collection but carry a per-season `seasons` map (roster membership, guest/active status per season). Use the helpers in `src/utils/playerSeason.ts` (`isActiveInSeason`, `isGuestInSeason`) and `playerStore.playersInSeason(seasonId)` rather than reading the map directly. `playerStore` also has a one-time migration action that backfills the `seasons` map for the launch season.

### Two Firebase access patterns

- **Stores** (`src/stores/`) use `onSnapshot` for real-time reactive data. Stores hold `matches`, `appearances`, and `players` arrays with a `*Loaded` boolean flag.
- **Services** (`src/services/`) use one-shot `getDocs`/`addDoc` for write operations or non-reactive reads (e.g. fetching appearances per player for the player detail view).

### State management (Pinia)

Five stores: `authStore`, `matchStore`, `playerStore`, `seasonStore`, `trainingStore`. The router is injected into every store via a Pinia plugin in `main.ts`, so stores can navigate with `this.router.push(...)`.

`matchStore` also drives the live match timer (`startMatch`/`pauseMatch`/`resumeMatch`/`endMatch`), which mutates the match doc directly. `trainingStore` follows the same reactive-store shape (`trainings`/`selectedTraining` with `*Loaded` flags), scoped by `seasonId`; training presence is a `presentPlayerIds` array on each training doc.

`authStore.init()` is called once in `App.vue` `onMounted` to subscribe to Firebase auth state — unauthenticated users are not redirected from most routes, but write operations require auth. Use the `useCanEdit()` composable (`src/composables/`) to gate edit UI — it is true only when a user is authenticated *and* the currently selected season is active.

### Routing & UI layer

Routes are defined manually in `src/router/index.ts` (not file-system auto-routing) but point at page components under `src/pages/` that follow a file-based naming convention: `pages/<domain>/index.vue` for list/index routes and `pages/<domain>/[id].vue` for detail routes. Route `meta` is typed (`title`, `layout`, `heading`, `breadcrumb`) and drives the page header and breadcrumbs.

Each page keeps its own private sub-components in a co-located `_components/` folder (e.g. `pages/matches/_components/MatchTimer.vue`). Truly shared components live under `src/components/` (`ui/`, `layout/`, `dialogs/`). Domains: home, matches, players, topscorers, training, washing (wasschema), login.

PrimeVue (Aura preset) handles UI components. The primary color palette is sourced from Tailwind CSS custom properties and unified in `main.ts` via `definePreset`. Global PrimeVue services (`Toast`, `ConfirmDialog`, `ConfirmationService`) are registered in `main.ts` and rendered in `App.vue`.

### i18n

All UI strings are in Dutch (`nl`), split by domain under `src/lang/nl/`. The `$t()` helper is globally injected — use it in every component for any user-facing text.

## Styling

- **Always use Tailwind CSS.** Never use `<style>` blocks, CSS modules, or CSS-in-JS.
- Dark mode is not enabled (PrimeVue `darkModeSelector: false`), so don't add `dark:` variants — they have no effect. Revisit only if dark mode is turned on.
- Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) for responsive layout.
