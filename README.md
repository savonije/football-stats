# ⚽ Football Stats Tracker

A **Vue 3 single-page application (SPA)** for tracking and managing football statistics for a youth football team.\
Built with **Vite+**, styled with **Tailwind CSS** and **Nuxt UI**, powered by **Pinia** for state management, and backed by **Firebase**.

---

## ✨ Features

- 🏆 Track matches per season, with a live match timer that stays in sync across viewers
- 🔎 Player pages, top scorers and training attendance
- 🧺 Wasschema (washing rota)
- 📱 Mobile-first SPA, installable to the iOS home screen
- 🇳🇱 Dutch UI throughout (vue-i18n)
- 🎨 Modern UI with **Tailwind CSS v4** + **Nuxt UI v4** components
- ☁️ Cloud-based backend with **Firebase** (auth, Firestore, hosting)
- ⚡ Vue 3 Composition API (`<script setup>`) and TypeScript

---

## 🛠 Tech Stack

- [Vue 3](https://vuejs.org/) – Frontend framework
- [Vite+](https://viteplus.dev/) – Unified toolchain (Vite, Vitest, Oxlint, Oxfmt) behind one `vp` CLI
- [TypeScript](https://www.typescriptlang.org/) – Type safety
- [Pinia](https://pinia.vuejs.org/) – State management
- [Vue Router](https://router.vuejs.org/) – Routing
- [Nuxt UI v4](https://ui.nuxt.com/) – UI components (works in plain Vue via its Vite plugin)
- [Tailwind CSS v4](https://tailwindcss.com/) – Utility-first CSS, themed in `src/styles/main.css` (no `tailwind.config.js`)
- [vue-i18n](https://vue-i18n.intlify.dev/) – Dutch UI strings
- [Firebase](https://firebase.google.com/) – Backend services (Auth, Firestore, Hosting)
- [Oxlint / Oxfmt](https://oxc.rs/) – Linting and formatting (via `vp check`)
- [Playwright](https://playwright.dev/) – End-to-end testing

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) and npm installed. The version is pinned in `.node-version` (read by `vp` and CI) and `.nvmrc` (read by `nvm use`) — currently **Node 24**. Bump both together.

### Installation

```sh
# Install dependencies
vp install
```

### Development

```sh
# Run the app locally with hot-reload
vp dev
```

### Production

```sh
# Type-check, build, and minify
npm run build
```

`npm run build` runs `vue-tsc` and `vp build` in parallel; `vp build` alone skips the type check.

### Linting & Formatting

```sh
# Format, lint and type-check in one go (--fix to apply)
vp check --fix

# Or individually
vp fmt
vp lint --fix
npm run type-check     # vue-tsc, which understands .vue better than the built-in
npm run knip           # unused files, exports and dependencies (CI fails on any finding)
```

### Testing

End-to-end tests use [Playwright](https://playwright.dev/) and live in `e2e/`. Playwright builds and serves the app itself on port 4174, so there is no dev server to start first.

```sh
npx playwright install chromium            # once, to get the browser

npm run test                               # run all e2e tests
npx playwright test e2e/home.spec.ts       # a single file
npx playwright test -g "shows top scorers" # by test title
```

The read-only specs run as-is. The specs that sign in and write (`match-lifecycle`, `match-players`, `training`) create data, drive it through the UI and delete it again, so they need a **staging** Firebase project — never production:

1. Point `.env` at a staging project (`npm run test` builds with `--mode staging`, ignoring `.env.production`).
2. Add an email/password user in that project only: Firebase Console → **Authentication → Users**.
3. `cp .env.e2e.example .env.e2e` and fill in `E2E_EMAIL` / `E2E_PASSWORD`, plus `E2E_PROJECT_ID` if your staging project isn't this repo's default. Playwright loads the file automatically.
4. Give staging an active season (`active: true`) with players in it — the edit UI is hidden otherwise.

Until that is done the write specs skip rather than fail. For CI, add the same variables to your repository secrets (see `.github/workflows/playwright.yml`).

---

## 🔥 Firebase Setup

This project uses **Firebase** for authentication, database, and hosting.\
You’ll need to set up Firebase and configure environment variables before running the app.

### 1. Create a Firebase Project

- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project (or use an existing one)
- Enable the services you need (Authentication, Firestore, Hosting, etc.)

### 2. Configure Environment Variables

Create a `.env` file in the root of your project and add the following keys:

```sh
VITE_FIREBASE_APIKEY=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_MESSAGE_SENDER_ID=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_CLUBNAME=""
```

See `.env.example` for the full list. Fill in the Firebase values from your project settings (**Project Settings > General > Your apps**), and set `VITE_CLUBNAME` to your team's name (used across the UI).

### 3. Firebase CLI Configuration

Initialize Firebase in your local environment (if not already done):

```sh
firebase login
firebase init
```

This writes two files. `firebase.json` holds the hosting config (it serves `dist/` and rewrites everything to `index.html`), while the project aliases live in `.firebaserc`:

```json
{
    "projects": {
        "default": "",
        "prod": ""
    }
}
```

Replace each `""` with a Firebase project ID — see `.firebaserc.example`. A bare `firebase deploy` targets `default`, so point that at the project you actually want to publish to and use a named alias (`firebase deploy -P prod`) for the others. `.firebaserc` is gitignored, so each clone sets its own. Note the e2e tests don't read it: they pick their project from `.env` (see above).

### 4. Deploy

```sh
npm run build
firebase deploy
```

---

## 📂 Project Structure

```plaintext
src/
├── pages/         # Route pages (index.vue / [id].vue) with co-located _components/
├── components/    # Shared components (ui/, layout/, dialogs/)
├── layouts/       # Page layouts (DefaultLayout, BlankLayout)
├── stores/        # Pinia stores (auth, match, player, season, training)
├── services/      # One-shot Firestore reads/writes
├── composables/   # Reusable composition functions (e.g. useCanEdit)
├── router/        # App routes
├── firebase/      # Firebase config & init
├── lang/          # i18n strings (Dutch)
├── utils/         # Helpers (date, match, playerSeason, table, training)
├── types/         # Shared TypeScript types
├── config/        # i18n & dayjs setup
├── constants/     # App-wide constants
├── styles/        # Global CSS
└── App.vue        # Root component
```

---

## 📜 License

This project is licensed under the **MIT License**.
