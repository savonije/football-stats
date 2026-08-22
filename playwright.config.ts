import { defineConfig, devices } from '@playwright/test'

try {
  process.loadEnvFile('.env.e2e')
} catch {
  // Absent locally is fine: the write specs skip, and CI passes secrets.
}

// Not 4173: a hand-started `npm run preview` there is built from
// .env.production, and reusing it would point the write specs at production.
const PORT = 4174

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
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
    command: `npm run build:e2e && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
