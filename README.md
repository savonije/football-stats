# ⚽ Football Stats Tracker

A **Vue 3 single-page application (SPA)** for tracking and managing football statistics for a youth football team.\
Built with **Vite**, styled with **Tailwind CSS** and **PrimeVue**, powered by **Pinia** for state management, and backed by **Firebase**.

---

## ✨ Features

- 🏆 Track team performance over the season
- 🔎 View individual and team statistics
- 📱 Mobile-friendly interface (SPA, no reloads)
- 🎨 Modern UI with **TailwindCSS** + **PrimeVue** components
- ☁️ Cloud-based backend with **Firebase** (auth, database, hosting)
- ⚡ Built with modern Vue 3 composition API and Vite

---

## 🛠 Tech Stack

- [Vue 3](https://vuejs.org/) – Frontend framework
- [Vite](https://vite.dev/) – Fast build & dev environment
- [TypeScript](https://www.typescriptlang.org/) – Type safety
- [Pinia](https://pinia.vuejs.org/) – State management
- [PrimeVue](https://primevue.org/) – UI components
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework
- [Firebase](https://firebase.google.com/) – Backend services (Auth, Firestore, Hosting)
- [ESLint](https://eslint.org/) – Code quality
- [Playwright](https://playwright.dev/) – End-to-end testing

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v22+) and npm installed.

### Installation

```sh
# Install dependencies
npm install
```

### Development

```sh
# Run the app locally with hot-reload
npm run dev
```

### Production

```sh
# Type-check, build, and minify
npm run build
```

### Linting & Formatting

```sh
# Lint with ESLint + oxlint (both auto-fix)
npm run lint

# Type-check with vue-tsc
npm run type-check

# Format source with Prettier
npm run prettier
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

Replace each `""` with a Firebase project ID — see `.firebaserc.example`. This project keeps two: `default` is the staging project the e2e tests write to, and `prod` is production. `.firebaserc` is gitignored, so each clone sets its own.

### 4. Deploy (Optional)

To deploy the app to Firebase Hosting:

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
├── utils/         # Helpers (playerSeason, match, training, tailwind)
├── types/         # Shared TypeScript types
├── config/        # i18n & dayjs setup
├── constants/     # App-wide constants
├── styles/        # Global CSS
└── App.vue        # Root component
```

---

## 📜 License

This project is licensed under the **MIT License**.
