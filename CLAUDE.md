# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with hot-reload
npm run build        # type-check + build for production
npm run lint         # run oxlint then eslint (with --fix)
npm run type-check   # vue-tsc type checking
npm run format       # prettier format src/
```

There are no tests in this project.

Deploy after building: `firebase deploy`

## Architecture

Vue 3 SPA (Composition API + `<script setup>`) for tracking football match stats for a youth team (Apollo '69 JO9). TypeScript throughout with `@` aliased to `src/`.

### Firestore data model

```
players/{playerId}
seasons/{seasonId}/matches/{matchId}
seasons/{seasonId}/matches/{matchId}/appearances/{appearanceId}
```

The active season is the `SEASON` constant in `src/constants/index.ts`. All Firestore queries are scoped to this season ID. When a new season starts, update this constant.

### Two Firebase access patterns

- **Stores** (`src/stores/`) use `onSnapshot` for real-time reactive data. Stores hold `matches`, `appearances`, and `players` arrays with a `*Loaded` boolean flag.
- **Services** (`src/services/`) use one-shot `getDocs`/`addDoc` for write operations or non-reactive reads (e.g. fetching appearances per player for the player detail view).

### State management (Pinia)

Three stores: `authStore`, `matchStore`, `playerStore`. The router is injected into every store via a Pinia plugin in `main.ts`, so stores can navigate with `this.router.push(...)`.

`authStore.init()` is called once in `App.vue` `onMounted` to subscribe to Firebase auth state — unauthenticated users are not redirected from most routes, but write operations require auth.

### UI layer

Views (`src/views/`) are thin wrappers: they apply `DefaultLayout` and render a single component. All logic lives in `src/components/`.

PrimeVue (Aura preset) handles UI components. The primary color palette is sourced from Tailwind CSS custom properties and unified in `main.ts` via `definePreset`. Global PrimeVue services (`Toast`, `ConfirmDialog`, `ConfirmationService`) are registered in `main.ts` and rendered in `App.vue`.

### i18n

All UI strings are in Dutch (`nl`), split by domain under `src/lang/nl/`. The `$t()` helper is globally injected — use it in every component for any user-facing text.
