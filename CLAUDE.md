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

Playwright tests live in `e2e/` and run against a preview build that `playwright.config.ts` builds and serves itself on port **4174** (`npm run build:e2e && npm run preview`). Port 4173 is deliberately avoided: a hand-started `npm run preview` there is built from `.env.production`, and reusing it would point the writing specs at the production project. Run a single spec/test:

```bash
npx playwright test e2e/home.spec.ts            # one file
npx playwright test -g "shows top scorers"      # by test title
```

The e2e tests hit **real Firestore data** through the preview build (no emulator — the Firestore emulator needs a JVM, and there is none here — and no fixtures). They come in two kinds:

- **Read-only specs** (`home`, `navigation`, `players`, `topscorers`) never log in, so their assertions are written defensively — e.g. `card.or(emptyMatches)` rather than expecting specific matches to exist. Keep new read-only specs data-agnostic.
- **Write specs** (`match-lifecycle`, `match-players`, `training`) sign in and mutate Firestore, so they run against the **staging** project: `build:e2e` builds with `--mode staging`, which loads `.env` instead of `.env.production`. Each creates its own match/training with a `uniqueLabel()` name, drives it, and deletes it again in `afterEach`. Shared plumbing lives in `e2e/helpers/app.ts`. `training.spec.ts` also carries two describes that only sign in (the attendance table is auth-gated but read-only) and one that stays signed out to assert the table is hidden — keep those data-agnostic like the read-only specs.

Two safety nets keep writes off production. `login()` watches the Firestore traffic on first paint and aborts unless the project is `E2E_PROJECT_ID` (default `football-ryan-staging`), and the test account only exists in staging, so a production build cannot get past sign-in. Credentials come from a gitignored `.env.e2e` (see `.env.e2e.example`), which `playwright.config.ts` loads via `process.loadEnvFile`. Without them the write specs **skip** rather than fail; they also skip when the staging project has no active season or no players, since `useCanEdit()` then hides every edit control.

**Never assert persistence with `page.reload()`.** Firestore applies writes to its local cache first and this app configures no offline persistence, so reloading straight after a click silently drops the mutation and the assertion passes or fails for the wrong reason. Waiting for the write to leave the browser is no good either: mutations go over `POST …Firestore/Write/channel`, but so does the channel handshake, so `waitForResponse` resolves too early. Instead open a second tab (`page.context().newPage()`) — it runs its own Firestore client, so whatever it renders came back from the server, which is also a truer test of the real-time sync the app relies on.

Selectors lean on roles and labels, with a `data-testid` where nothing else fits — prefer adding one over reaching into Reka/Nuxt UI internals, which is what made the old PrimeVue selectors brittle. Four Nuxt UI traps worth knowing:

- `UTable` sets `role="button"` on a row whenever `@select` is bound, which replaces the implicit `role="row"`. Match `tbody tr` directly rather than `getByRole('row')` for data rows.
- `UTabs` (used as a segmented control for the attendance period) is `role="tab"` with `aria-selected`, not a pressed button.
- Dates go through `src/components/ui/DatePicker.vue` (a `UPopover` + `UCalendar`), not `UInputDate` — the segmented spinbutton field reads nothing like the rest of the forms. Click its `[data-testid="date-input"]` trigger, then the day: every cell carries an exact `data-value="YYYY-MM-DD"`, so there is no month-boundary ambiguity to work around.
- `role="alertdialog"` cannot be set as a plain attribute on `UModal`; Reka hardcodes `role="dialog"` on the content element. Pass it through the `content` prop (`:content="{ role: 'alertdialog' }"`), which is how `acceptConfirm()` still finds the confirm dialog without colliding with the dialog underneath.

The global test timeout is raised to 90s: an authenticated spec spends several seconds on Firebase round trips before it reaches the feature under test, which overruns Playwright's 30s default under parallel workers.

Knip (`knip.json`) runs on its auto-detected defaults — it picks up the Vite, Playwright, ESLint and Prettier configs on its own, and follows `src/styles/main.css` for CSS-only dependencies like `tailwindcss`. Only `public/**` is ignored, because those assets are referenced by absolute URL from `index.html` and can't be resolved statically. `@iconify-json/lucide` is in `ignoreDependencies`: the icon set is read by the `@nuxt/ui` Vite plugin's scanner, never imported, so knip cannot see it. Don't narrow `project` to `.ts`/`.vue` — that drops the CSS graph and produces false "unused dependency" hits.

Config comes from `VITE_*` env vars (see `.env.example`): Firebase credentials plus `VITE_CLUBNAME`. There is no hardcoded config in source. `.env` points at the **staging** project and `.env.production` at production, which is why `build:e2e` builds in staging mode. The Playwright CI job needs `VITE_CLUBNAME` in its secrets as well — without it the club name renders empty and `navigation.spec.ts` fails.

`npm run type-check` covers `e2e/**` too (it is in `tsconfig.node.json`), so spec type errors surface before the suite runs. Note `npm run prettier` only formats `src/`; e2e files are not checked by CI, but match the same style.

CI (`.github/workflows/`) runs `prettier:check`, `type-check`, `knip`, and the Playwright suite on every push/PR to `main` — run `npm run prettier` and `npm run type-check` before handing work off, or CI will fail on formatting alone. `knip` currently passes clean and exits non-zero on any finding, so don't leave unused files or exports behind — an internal e2e helper should stay unexported rather than become an unused export.

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

[Nuxt UI v4](https://ui.nuxt.com) handles UI components — it works in plain Vue via `@nuxt/ui/vue-plugin`, with the `ui()` Vite plugin registered in `vite.config.ts`. Components are auto-imported under the `U` prefix (`UButton`, `UModal`, …) and need no import statement; composable auto-import is deliberately **off** (`autoImport: false`) so `useToast`/`useOverlay` are imported explicitly like everything else in this repo.

`<UApp>` in `App.vue` provides the toast, tooltip and overlay outlets and carries the `nl` locale (which is what makes calendars start on Monday). Semantic colours are mapped in `vite.config.ts`: `primary` points at the project's own `--color-primary-*` scale from `@theme`, so `bg-primary` and friends keep working unchanged.

Icons are Lucide via `@iconify-json/lucide`, referenced as `i-lucide-*`. `icon.clientBundle.scan` bundles only the icons actually used in source, so nothing is fetched from the Iconify API at runtime — an icon added by string interpolation would not be found by the scanner.

Two composables replace PrimeVue services: `useAppToast()` (`success`/`warn`/`error`, supplying the heading and `TOAST_LIFE`) and `useConfirmDialog()`, which wraps `useOverlay()` and resolves to a boolean so call sites read `if (await confirm({ … }))`. An overlay component must declare `open` and forward it to its `UModal` — `OverlayProvider` binds `v-model:open` on the component, and without it the modal keeps its own state and stays on screen after a choice.

Tables are `UTable` (TanStack Table). Shared bits live in `src/utils/table.ts`: `TABLE_UI` carries the gradient header and striped/hover rows, and `sortableHeader()` renders the sort toggle that `<Column sortable>` used to give for free. Dates go through `src/utils/date.ts`, which bridges plain `Date` and `@internationalized/date`'s `CalendarDate` — hold a `CalendarDate` in `shallowRef`, never `ref`, or Vue's deep unwrapping strips its private field and the type stops matching.

### i18n

All UI strings are in Dutch (`nl`), split by domain under `src/lang/nl/`. The `$t()` helper is globally injected (`globalInjection: true`, non-legacy) — use it in every component for any user-facing text; `useI18n()` in `<script setup>` when you need `t` in TS. Pluralized keys use vue-i18n pipe syntax (`game: 'Wedstrijd | Wedstrijden'`) and are called with a count — which is what the `count` field in route `meta.heading`/`meta.breadcrumb` feeds.

## Styling

Tailwind v4 via `@tailwindcss/vite` — **there is no `tailwind.config.js`**; the theme is an `@theme { … }` block in `src/styles/main.css`. A `tailwind` skill (`.claude/skills/tailwind/SKILL.md`) documents the available tokens and conventions; consult it before writing classes.

- **Always use Tailwind CSS.** Never use `<style>` blocks, CSS modules, or CSS-in-JS.
- Use the existing `@theme` tokens (`primary-*` scale, `shadow-card`, `text-xxs`, `tracking-label`, …) and scale utilities instead of arbitrary `[Npx]` or hex values. Add a new token to `@theme` if nothing fits.
- **Dialog width is set exactly one way:** a Tailwind container width class through `UModal`'s `ui` prop — `:ui="{ content: 'w-md' }"` (the `w-3xs … w-7xl` scale). Never `style="width: 450px"`, `:style="{ width: … }"`, `w-96`, or `w-[400px]`. The `max-w-[95%]` cap for small screens is set once in `vite.config.ts` under `ui.modal`, so no responsive variant is needed.
- Dark mode is not enabled: `colorMode: false` in `vite.config.ts` stops Nuxt UI registering the plugin that calls VueUse's `useDark()`. Leave it off — with it on, `.dark` lands on `<html>` from the OS preference and every Nuxt UI component goes dark while the page keeps the light background from `main.css`. Don't add `dark:` variants either; they have no effect. Revisit both together only if dark mode is actually wanted.
- Use Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) for responsive layout.
- Nuxt UI components are restyled through their own `ui` prop (per component) or `ui.<component>` in `vite.config.ts` (app-wide) — not global CSS. This is why `main.css` no longer carries component overrides and nothing needs `!important` any more. Reusable slot overrides belong next to the component that uses them, like `TABLE_UI` in `src/utils/table.ts`.

## Formatting

Prettier is not optional here — CI fails on it, and the config carries real conventions: 4-space indent, single quotes, 80 print width, and `vueIndentScriptAndStyle: true` (so `<script setup>` bodies are indented one level). Three plugins rewrite code on save: import sorting (third-party → `@/*.vue` → `@/*` → relative), Vue attribute ordering, and Tailwind class sorting. Don't hand-order imports, attributes, or classes — write them and run `npm run prettier`.
