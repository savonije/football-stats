# ⚽ Football Stats Tracker

A **Vue 3 single-page application (SPA)** for tracking and managing football statistics for a youth football team.\
Built with **Vite+**, styled with **Tailwind CSS** and **Nuxt UI**, powered by **Pinia** for state management, and backed by **Firebase**.

---

## ✨ Features

- 🏆 Track matches per season, with a live match timer that stays in sync across viewers
- 📅 Sync the match schedule from the KNVB (see [KNVB match sync](#-knvb-match-sync))
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

Make sure you have [Node.js](https://nodejs.org/) and npm installed. The version is pinned in `.nvmrc` (read by `nvm use` and CI) and `engines.node` in `package.json` (read by `vp`) — currently **Node 26**. Bump both together.

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

The tests run against the [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite), which Playwright starts and seeds itself, so they need no Firebase project, no credentials and no `.env`. Each run starts from an empty database with one seeded season, six players and a test user. Nothing is written to staging or production.

The Firestore emulator is a Java program, so install **Java 21+** once:

```sh
brew install openjdk@21
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
```

To skip the emulator startup on every run, keep `npm run emulators` running in a second terminal; Playwright reuses it.

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

Replace each `""` with a Firebase project ID — see `.firebaserc.example`. A bare `firebase deploy` targets `default`, so point that at the project you actually want to publish to and use a named alias (`firebase deploy -P prod`) for the others. `.firebaserc` is gitignored, so each clone sets its own. The e2e tests don't read it: they run against the local emulators (see above).

### 4. Deploy

```sh
npm run build
firebase deploy
```

This deploys Hosting and the Firestore security rules in `firestore.rules`. Change rules in that file, not in the Firebase console, or the next deploy overwrites the console version.

---

## 📅 KNVB match sync

The **Wedstrijdschema synchroniseren** button on the home page (also in the menu) pulls the team's upcoming fixtures from the KNVB through [Sportlink Club.Dataservice](https://sportlinkservices.freshdesk.com/nl/support/solutions/articles/9000062942-lijst-met-artikelen-van-club-dataservice).

---

## 📂 Project Structure

```plaintext
src/
├── pages/         # Route pages (index.vue / [id].vue) with co-located _components/
├── components/    # Shared components (ui/, layout/, dialogs/)
├── layouts/       # Page layouts (DefaultLayout, BlankLayout)
├── stores/        # Pinia stores (auth, match, player, season, settings, training)
├── services/      # One-shot Firestore reads/writes, KNVB (Sportlink) fetch
├── composables/   # Reusable composition functions (e.g. useCanEdit)
├── router/        # App routes
├── firebase/      # Firebase config & init
├── lang/          # i18n strings (Dutch)
├── utils/         # Helpers (date, knvb, match, playerSeason, table, training)
├── types/         # Shared TypeScript types
├── config/        # i18n & dayjs setup
├── constants/     # App-wide constants
├── styles/        # Global CSS
└── App.vue        # Root component
```

---

## 📜 License

This project is licensed under the **MIT License**.
