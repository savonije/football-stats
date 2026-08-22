import { defineConfig, devices } from '@playwright/test'

// Credentials for the staging test user live outside git; loading them here
// means `npm run test` works without exporting them in every shell.
try {
  process.loadEnvFile('.env.e2e')
} catch {
  // No local file: the write specs will skip, and CI passes them as secrets.
}

// Deliberately not 4173: `npm run preview` is built from .env.production, and
// reusing such a server would point the writing specs at the production
// project. Playwright is the only thing that ever serves this port.
const PORT = 4174

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The specs that sign in spend several seconds on real Firebase round trips
  // before they touch the feature under test, which overruns the 30s default
  // once workers run in parallel.
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // `build:e2e` builds in staging mode (.env), so the specs that sign in and
    // write can never reach the production project.
    command: `npm run build:e2e && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
