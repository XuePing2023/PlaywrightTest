import process from 'node:process'

import { defineConfig, devices } from '@playwright/test'
import type { ReporterDescription } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */

/** Vite's `preview` server port. Override with PLAYWRIGHT_BASE_URL when needed. */
const port = 4173
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`

/* `html` produces the artifact we upload; `github` annotates the PR in CI. */
const reporter: ReporterDescription[] = [
  ['html', { open: 'never' }],
  process.env.CI ? ['github'] : ['list'],
]

export default defineConfig({
  testDir: './e2e',
  /* Tests are independent, so let them run in parallel locally. */
  fullyParallel: true,
  /* Fail the run if a test.only is accidentally committed. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only. */
  retries: process.env.CI ? 2 : 0,
  /* Run serially on CI for stable, easy-to-read output. */
  workers: process.env.CI ? 1 : undefined,
  reporter,

  use: {
    baseURL,
    /* Diagnose flaky/failing runs without paying the cost on the happy path. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to widen coverage locally; CI installs chromium only.
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  /*
   * Tests run against the production bundle that `vite preview` serves, so a
   * plain `pnpm test:e2e` works on a clean checkout without a manual build.
   * `--strictPort` fails loudly instead of silently moving to another port.
   */
  webServer: {
    command: `pnpm run build-only && pnpm run preview --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    /* The build runs here, so surface its output in the test log. */
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
