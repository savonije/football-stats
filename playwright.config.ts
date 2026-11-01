import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite-plus';

// The same env the e2e build is made from, so specs can read VITE_CLUBNAME.
for (const [name, value] of Object.entries(
    loadEnv('emulator', process.cwd(), ''),
)) {
    process.env[name] ??= value;
}

// Not 4173, so a hand-started `npm run preview` is never reused by accident.
const PORT = 4174;

export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    fullyParallel: true,
    timeout: 60_000,
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
    webServer: [
        {
            command: 'npm run emulators',
            // The CLI starts Auth after Firestore, so this waits for both.
            url: 'http://127.0.0.1:9099',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            // A hard kill stops the CLI but orphans the Java Firestore process.
            gracefulShutdown: { signal: 'SIGINT', timeout: 10_000 },
        },
        {
            command: `npm run build:e2e && npm run preview -- --port ${PORT} --strictPort`,
            url: `http://localhost:${PORT}`,
            reuseExistingServer: !process.env.CI,
            timeout: 180_000,
        },
    ],
});
